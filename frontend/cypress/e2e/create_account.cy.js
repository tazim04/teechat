describe("Create Account", () => {
  it("should successfully create a new account", () => {
    cy.visit("http://localhost:5173");

    cy.get("div").contains("Create an account.").click();

    cy.get('input[name="email"]').type("t@gmail.com");
    cy.get('input[name="username"]').type("tester");
    cy.get('input[name="password"]').type("1q2w3efg45");
    cy.get('input[name="confirmPassword"]').type("1q2w3efg45");

    cy.get("button").contains("Next").click(); // Click the Next button

    cy.get('input[name="birthday"]').type("2000-01-01");

    // Select interests
    cy.get(".rs-picker-textbox").click();
    cy.get(".rs-checkbox-checker").contains("Art").click();
    cy.get(".rs-checkbox-checker").contains("Books").click();
    cy.get("body").click(0, 0);

    cy.get('input[name="instagram"]').type("instagram.com/tester");

    cy.get("button").contains("Create Account").click(); // Click the Next button

    cy.url().should("include", "/main"); // Check if the URL includes /main
    cy.contains("Welcome back tester!"); // Check if the Welcome, tester! text is present
  });
});
