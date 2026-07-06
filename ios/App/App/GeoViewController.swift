import UIKit
import Capacitor

/**
 * The app's bridge view controller. Plugins that live inside the app target
 * (rather than in an SPM/npm package) are not auto-discovered by Capacitor —
 * they must be registered here, at bridge load.
 */
class GeoViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(GeoPayPlugin())
    }
}
