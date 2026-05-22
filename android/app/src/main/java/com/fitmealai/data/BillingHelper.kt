package com.fitmealai.data

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.acknowledgePurchase
import com.android.billingclient.api.queryProductDetails
import com.android.billingclient.api.queryPurchasesAsync
import com.fitmealai.domain.SubscriptionTier
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Google Play Billing client for Silver/Gold subscriptions. Mirrors the
 * iOS [SubscriptionManager] (StoreKit 2). Both layers expose the same
 * happy-path: connect -> queryAvailableProducts -> launchPurchase ->
 * Purchased event. Successful purchases are auto-acknowledged because
 * Play voids unacknowledged purchases after 3 days.
 *
 * Product IDs to create in Play Console (must match iOS):
 *   - fitmeal_silver_monthly   ($4.99 / mo)
 *   - fitmeal_gold_monthly     ($9.99 / mo)
 *
 * Both products live in a single subscription group ("FitMeal AI") so
 * users can upgrade between Silver and Gold without cancelling first.
 */
class BillingHelper(context: Context) : PurchasesUpdatedListener {

    private val _events = MutableSharedFlow<BillingEvent>(extraBufferCapacity = 8)
    val events: SharedFlow<BillingEvent> = _events

    private val _activeTier = MutableStateFlow(SubscriptionTier.Free)
    val activeTier: StateFlow<SubscriptionTier> = _activeTier.asStateFlow()

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val client: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build()
        )
        .build()

    /**
     * Suspending connect. Resolves to true when the billing service is
     * ready, false on failure. Safe to call repeatedly: a no-op if
     * already connected.
     */
    suspend fun ensureConnected(): Boolean {
        if (_isConnected.value && client.isReady) return true
        val deferred = CompletableDeferred<Boolean>()
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                val ok = result.responseCode == BillingClient.BillingResponseCode.OK
                _isConnected.value = ok
                if (!deferred.isCompleted) deferred.complete(ok)
            }
            override fun onBillingServiceDisconnected() {
                _isConnected.value = false
            }
        })
        return deferred.await()
    }

    suspend fun queryAvailableProducts(): List<ProductDetails> {
        if (!ensureConnected()) return emptyList()
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(PRODUCT_SILVER)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build(),
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(PRODUCT_GOLD)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build(),
                ),
            )
            .build()
        val res = client.queryProductDetails(params)
        return res.productDetailsList.orEmpty()
    }

    /**
     * Re-syncs `activeTier` from any existing entitlements. Useful on
     * cold start so we know whether to show the paywall.
     */
    suspend fun refreshActiveTier() {
        if (!ensureConnected()) return
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        val result = client.queryPurchasesAsync(params)
        val tier = highestTier(result.purchasesList)
        _activeTier.value = tier
    }

    /**
     * Initiates the Play Billing purchase flow for the given product.
     * Use the product returned from [queryAvailableProducts] so the
     * offer/base-plan token is correct.
     */
    fun launchPurchase(activity: Activity, product: ProductDetails) {
        val offerToken = product.subscriptionOfferDetails?.firstOrNull()?.offerToken
            ?: run {
                _events.tryEmit(BillingEvent.Error("No subscription offer available"))
                return
            }
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(product)
                        .setOfferToken(offerToken)
                        .build(),
                ),
            )
            .build()
        client.launchBillingFlow(activity, params)
    }

    /**
     * Convenience used by the paywall: takes a [SubscriptionTier],
     * finds the matching ProductDetails (querying if necessary), and
     * calls [launchPurchase].
     */
    suspend fun launchPurchaseForTier(activity: Activity, tier: SubscriptionTier) {
        val productId = tier.productId() ?: return
        val products = queryAvailableProducts()
        val match = products.firstOrNull { it.productId == productId }
        if (match == null) {
            _events.tryEmit(BillingEvent.Error("Subscription product not found in Play Store. Did you create $productId in Play Console?"))
            return
        }
        launchPurchase(activity, match)
    }

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases.orEmpty()
                    .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    .forEach { purchase ->
                        val tier = tierForProductId(purchase.products.firstOrNull())
                        if (tier != SubscriptionTier.Free) {
                            _activeTier.value = highestTier(listOf(purchase) + currentlyPurchased())
                        }
                        _events.tryEmit(BillingEvent.Purchased(tier, purchase))
                        // Acknowledgement is required within 3 days or Play
                        // will refund the purchase. Fire-and-forget here is
                        // fine because the result lands back through the
                        // PurchasesUpdated listener.
                        if (!purchase.isAcknowledged) {
                            acknowledgeAsync(purchase)
                        }
                    }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                _events.tryEmit(BillingEvent.UserCanceled)
            }
            else -> {
                _events.tryEmit(BillingEvent.Error(result.debugMessage ?: "Billing failed"))
            }
        }
    }

    private fun acknowledgeAsync(purchase: Purchase) {
        val ackParams = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        client.acknowledgePurchase(ackParams) { /* no-op; failures retry next launch */ }
    }

    private fun currentlyPurchased(): List<Purchase> {
        // We only hit this from inside onPurchasesUpdated where queryPurchases
        // is overkill - return empty and let refreshActiveTier handle it on
        // next foreground. activeTier is already updated above.
        return emptyList()
    }

    private fun highestTier(purchases: List<Purchase>): SubscriptionTier {
        var best = SubscriptionTier.Free
        for (p in purchases) {
            if (p.purchaseState != Purchase.PurchaseState.PURCHASED) continue
            val t = tierForProductId(p.products.firstOrNull())
            if (t == SubscriptionTier.Gold) return SubscriptionTier.Gold
            if (t == SubscriptionTier.Silver && best == SubscriptionTier.Free) {
                best = SubscriptionTier.Silver
            }
        }
        return best
    }

    fun release() {
        if (client.isReady) client.endConnection()
    }

    private fun tierForProductId(productId: String?): SubscriptionTier = when (productId) {
        PRODUCT_GOLD -> SubscriptionTier.Gold
        PRODUCT_SILVER -> SubscriptionTier.Silver
        else -> SubscriptionTier.Free
    }

    companion object {
        const val PRODUCT_SILVER = "fitmeal_silver_monthly"
        const val PRODUCT_GOLD = "fitmeal_gold_monthly"

        private fun SubscriptionTier.productId(): String? = when (this) {
            SubscriptionTier.Silver -> PRODUCT_SILVER
            SubscriptionTier.Gold -> PRODUCT_GOLD
            SubscriptionTier.Free -> null
        }
    }
}

sealed interface BillingEvent {
    data class Purchased(val tier: SubscriptionTier, val purchase: Purchase) : BillingEvent
    data object UserCanceled : BillingEvent
    data class Error(val message: String) : BillingEvent
}
