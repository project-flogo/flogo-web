/**
 * Add activity to the diagram - searches the searchActivity and
 * adds the first activity of the search result to the diagram.
 * If searchActivity is not provided, adds the first activity
 * from the activity list of add activity popup
 *
 * @param searchActivity : activity name to add
 * @param clickBtnOptions : ClickOptions
 * */
export function addActivity(searchActivity?, clickBtnOptions = {}) {
  getAddActivityButton().click(clickBtnOptions);
  if (searchActivity) {
    getAddActivitySearchInput().type(searchActivity);
  }
  cy.get('[data-cy=diagram-add-activity-activity]')
    .eq(0)
    .click();
}

export function getAddActivityButton() {
  return cy.get('[data-cy=diagram-add-activity-btn]');
}

export function getAddActivitySearchInput() {
  return cy.get('[data-cy=diagram-add-activity-search-input]');
}
