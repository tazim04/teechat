describe("JWT Expiration", () => {
  it("should simulate JWT expiration", () => {
    // Visit the app
    cy.visit("http://localhost:5173");

    // Simulate user sign-in
    cy.get('input[name="username"]').type("tazim04");
    cy.get('input[name="password"]').type("tazim04");
    cy.get("button").contains("Sign in").click();

    // Ensure we're on the main page
    cy.url().should("include", "/main");
    cy.contains("Welcome back tazim04!");

    const currentTime = Date.now();

    cy.window().then((win) => {
      const newTime = currentTime + 15 * 60 * 1000;
      cy.stub(win.Date, "now").returns(newTime); // Mock Date.now() to simulate real time passage
    });
  });
});
