export function pressEscapeKey() {
  cy.get('body').type('{esc}');
}
