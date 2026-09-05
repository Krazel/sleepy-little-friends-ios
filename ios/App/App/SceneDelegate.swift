import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        let controller = CAPBridgeViewController()
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = controller
        window?.makeKeyAndVisible()
        #if DEBUG
        DispatchQueue.main.asyncAfter(deadline: .now() + 20) { [weak controller] in
            guard let webView = controller?.webView else { return }
            NSLog("Sleepy QA URL: %@", webView.url?.absoluteString ?? "nil")
            webView.evaluateJavaScript("JSON.stringify({url:location.href,ready:document.readyState,title:document.title,buttons:document.querySelectorAll('button').length,html:document.documentElement.outerHTML.slice(0,1200)})") { value, error in
                NSLog("Sleepy QA page: %@ error: %@", String(describing:value), String(describing:error))
            }
        }
        #endif
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
