export function initViews(db, viewsData) {

  let views = viewsData.reduce((all, view) => {
    all[view.key] = {
      map: view.map
    };
    return all;
  }, {});

  let designId = `_design/views`;

  return db.get(designId)
    .then(doc => db.remove(doc))
    .catch(err => {
      if (err.name === 'not_found') {
        return Promise.resolve(null);
      } else {
        throw new Error(err);
      }
    })
    .then(() => db.put({
      _id: designId,
      views
    }))
    .then(() => {
      return viewsData.reduce((previous, view) => {
        return previous.then(() => db.query(`views/${view.key}`, {'stale': 'update_after'}));
      }, Promise.resolve(true));
    });
}
