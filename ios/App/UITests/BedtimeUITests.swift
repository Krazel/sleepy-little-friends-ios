import XCTest

final class BedtimeUITests: XCTestCase {
    private func changeLanguage(_ app: XCUIApplication, label: String, option: String, visit: String) {
        let trigger = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", label)).firstMatch
        XCTAssertTrue(trigger.waitForExistence(timeout: 10), app.debugDescription)
        trigger.tap()
        let item = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", option)).firstMatch
        XCTAssertTrue(item.waitForExistence(timeout: 5), app.debugDescription)
        item.tap()
        XCTAssertTrue(app.buttons[visit].waitForExistence(timeout: 10), app.debugDescription)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let image = XCTAttachment(screenshot: app.screenshot())
        image.name = name; image.lifetime = .keepAlways; add(image)
    }
    func testBedtimeAndLanguagePersistence() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(es)", "-AppleLocale", "es_ES"]
        app.launch()
        XCTAssertTrue(app.buttons["Visitar a Luna"].waitForExistence(timeout: 30), app.debugDescription)
        capture(app, "iPhone-home-es")
        changeLanguage(app, label: "Idioma", option: "EN", visit: "Visit Luna")
        changeLanguage(app, label: "Language", option: "ES", visit: "Visitar a Luna")
        app.buttons["Visitar a Luna"].tap()
        XCTAssertTrue(app.buttons["Escuchar la pista"].waitForExistence(timeout: 10))
        app.buttons["Escuchar la pista"].tap()
        capture(app, "iPhone-room-es")
        app.buttons["Sus habitaciones"].tap()
        app.buttons["Para mayores"].tap()
        XCTAssertTrue(app.buttons["Escuchar la voz"].waitForExistence(timeout: 10))
        // WKWebView exposes clipped dialog controls as hittable. Scroll the
        // panel itself before tapping controls below its visible lower edge.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.80))
            .press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.40)))
        let original = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Voz anterior · Sarah")).firstMatch
        XCTAssertTrue(original.waitForExistence(timeout: 10), app.debugDescription)
        original.tap()
        XCTAssertTrue(app.links["Voz de IA: Sarah · ElevenLabs (elevenlabs.io)"].waitForExistence(timeout: 5), app.debugDescription)
        app.buttons["Escuchar la voz"].tap()
        let spain = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "España · Valeria")).firstMatch
        XCTAssertTrue(spain.exists, app.debugDescription)
        spain.tap()
        XCTAssertTrue(app.links["Voz de IA: Valeria · ElevenLabs (elevenlabs.io)"].waitForExistence(timeout: 5), app.debugDescription)
        app.buttons["Escuchar la voz"].tap()
        capture(app, "iPhone-voice-options")
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.35))
            .press(forDuration: 0.1, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.80)))
        app.buttons["Cerrar opciones"].tap()
        changeLanguage(app, label: "Idioma", option: "EN", visit: "Visit Luna")
        capture(app, "iPhone-home-en")
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Visit Luna"].waitForExistence(timeout: 20), "Manual English choice must persist on a Spanish device")
    }
}
