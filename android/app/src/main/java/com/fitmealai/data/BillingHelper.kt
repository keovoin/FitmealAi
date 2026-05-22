package com.fitmealai.data

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.queryProductDetails
import com.fitmealai.domain.SubscriptionTier
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

/**
 * Google Play Billing scaffold for Silver/Gold subscriptions. Mirrors
 * the iOS StoreKit 2 stub — both will be wired to the real product IDs
 * as soon as Console SKUs are created.
 *
 * Product IDs to create in Play Console (matching iOS App Store SKUs):
 *   - fitmeal_silver_monthly   ($4.99 / mo)
 *   - fitmeal_gold_monthly     ($9.99 / mo)
 *
 * The Play Console subscription must use the "subs" product type with
 * one base plan per tier. The first launch where billing is wired will
 * call [connect], then [queryAvailableProducts], then [launchPurchase].
 */
class BillingHelper(context: Context) : PurchasesUpdatedListener {

    private val _events = MutableSharedFlow<BillingEvent>(extraBufferCapacity = 8)
    val events: SharedFlow<BillingEvent> = _events

    private val client: BillingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases(
            PendingPurchasesParams.newBuilder()
                .enableOneTimeProducts()
                .build()
        )
        .build()

    fun connect(onReady: (Boolean) -> Unit) {
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                onReady(result.responseCode == BillingClient.BillingResponseCode.OK)
            }
            override fun onBillingServiceDisconnected() { /* will retry on next call */ }
        })
    }

    suspend fun queryAvailableProducts(): List<ProductDetails> {
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

    override fun onPurchasesUpdated(result: BillingResult, purchases: MutableList<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases.orEmpty()
                    .filter { it.purchaseState == Purchase.PurchaseState.PURCHASED }
                    .forEach { purchase ->
                        val tier = tierForProductId(purchase.products.firstOrNull())
                        _events.tryEmit(BillingEvent.Purchased(tier, purchase))
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
    }
}

sealed interface BillingEvent {
    data class Purchased(val tier: SubscriptionTier, val purchase: Purchase) : BillingEvent
    data object UserCanceled : BillingEvent
    data class Error(val message: String) : BillingEvent
}
