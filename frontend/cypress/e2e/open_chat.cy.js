describe("Sign in and open a chat", () => {
  it("should successfully sign and open a chat", () => {
    cy.visit("http://localhost:5173");

    cy.get('input[name="username"]').type("tazim04");
    cy.get('input[name="password"]').type("tazim04");

    cy.get("button").contains("Sign in").click();

    cy.url().should("include", "/main"); // Check if the URL includes /main
    cy.contains("Welcome back tazim04!"); // Check if the Welcome, tester! text is present

    cy.get("div").contains("bob12").click();
    cy.contains("No messages in this conversation");
  });
});
