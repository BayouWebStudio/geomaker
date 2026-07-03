import Foundation
import Capacitor
import StoreKit

/**
 * GeoPay: the one-time "unlock everything" purchase, on StoreKit 2 directly —
 * no third-party SDK, no server, no data collection. Exposed to the web app
 * as window.Capacitor.Plugins.GeoPay with four promise methods.
 *
 * Product: non-consumable, created in App Store Connect (see APPSTORE.md).
 */
@objc(GeoPayPlugin)
public class GeoPayPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GeoPayPlugin"
    public let jsName = "GeoPay"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isUnlocked", returnType: CAPPluginReturnPromise),
    ]

    private let productId = "com.bayouwebstudio.geomaker.pro"

    /// Localized price + title straight from the App Store, for the paywall UI.
    @objc func getProduct(_ call: CAPPluginCall) {
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product not found")
                    return
                }
                call.resolve([
                    "price": product.displayPrice,
                    "title": product.displayName,
                ])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func purchase(_ call: CAPPluginCall) {
        Task {
            do {
                guard let product = try await Product.products(for: [productId]).first else {
                    call.reject("Product not found")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let verification):
                    if case .verified(let transaction) = verification {
                        await transaction.finish()
                        call.resolve(["unlocked": true])
                    } else {
                        call.reject("Purchase could not be verified")
                    }
                case .userCancelled:
                    call.resolve(["unlocked": false, "cancelled": true])
                case .pending:
                    call.resolve(["unlocked": false, "pending": true])
                @unknown default:
                    call.resolve(["unlocked": false])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    /// Required by App Review for non-consumables: re-sync with the App Store
    /// (e.g. after reinstall or on a new device) and report entitlement.
    @objc func restore(_ call: CAPPluginCall) {
        Task {
            // sync() can throw if the user cancels the sign-in sheet — the
            // entitlement check below is still the source of truth
            try? await AppStore.sync()
            call.resolve(["unlocked": await self.entitled()])
        }
    }

    @objc func isUnlocked(_ call: CAPPluginCall) {
        Task {
            call.resolve(["unlocked": await self.entitled()])
        }
    }

    private func entitled() async -> Bool {
        for await entitlement in Transaction.currentEntitlements {
            if case .verified(let transaction) = entitlement,
               transaction.productID == productId,
               transaction.revocationDate == nil {
                return true
            }
        }
        return false
    }
}
