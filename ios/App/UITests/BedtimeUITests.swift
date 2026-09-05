import XCTest

final class BedtimeUITests: XCTestCase {
    func testBedtimeAndLanguagePersistence() throws {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(es)", "-AppleLocale", "es_ES"]
        app.launch()
        let luna = app.buttons["Visitar a Luna"]
        XCTAssertTrue(luna.waitForExistence(timeout: 30), app.debugDescription)
        let home = XCTAttachment(screenshot: app.screenshot())
        home.name = "iPhone-home-es"; home.lifetime = .keepAlways; add(home)
        luna.tap()
        XCTAssertTrue(app.buttons["Escuchar la pista"].waitForExistence(timeout: 10))
        app.buttons["Escuchar la pista"].tap()
        let room = XCTAttachment(screenshot: app.screenshot())
        room.name = "iPhone-room-es"; room.lifetime = .keepAlways; add(room)
        app.buttons["Sus habitaciones"].tap()
        XCTAssertTrue(luna.waitForExistence(timeout: 10))
        app.buttons["Para mayores"].tap()
        XCTAssertTrue(app.buttons["Escuchar la voz"].waitForExistence(timeout: 10))
        app.buttons["Escuchar la voz"].tap()
        app.buttons["Cerrar opciones"].tap()
        let language = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "Idioma")).firstMatch
        XCTAssertTrue(language.waitForExistence(timeout: 10), app.debugDescription)
        // UIKit can finish the WebKit dialog dismissal after its AX nodes disappear.
        Thread.sleep(forTimeInterval: 1)
        language.coordinate(withNormalizedOffset: CGVector(dx: 0.25, dy: 0.5)).press(forDuration: 0.2)
        let picker = XCTAttachment(screenshot: app.screenshot())
        picker.name = "language-picker"; picker.lifetime = .keepAlways; add(picker)
        let wheel = app.pickerWheels.firstMatch
        if wheel.waitForExistence(timeout: 3) {
            wheel.adjust(toPickerWheelValue: "EN")
            if app.buttons["Done"].exists { app.buttons["Done"].tap() }
            else if app.buttons["OK"].exists { app.buttons["OK"].tap() }
            else if app.buttons["Aceptar"].exists { app.buttons["Aceptar"].tap() }
        } else {
            let english = app.descendants(matching: .any).matching(NSPredicate(format: "label == %@", "EN")).firstMatch
            XCTAssertTrue(english.waitForExistence(timeout: 3), app.debugDescription)
            english.tap()
        }
        XCTAssertTrue(app.buttons["Visit Luna"].waitForExistence(timeout: 10), app.debugDescription)
        let englishHome = XCTAttachment(screenshot: app.screenshot())
        englishHome.name = "iPhone-home-en"; englishHome.lifetime = .keepAlways; add(englishHome)
        app.terminate(); app.launch()
        XCTAssertTrue(app.buttons["Visit Luna"].waitForExistence(timeout: 20), "Manual English choice must persist on a Spanish device")
    }
}
