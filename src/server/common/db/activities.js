import { initViews as commonInitViews } from './common';

export const VIEWS = {
  name: 'name',
  where: 'where',
};

const views = [
  {
    key: VIEWS.where,
    map: function (doc) { emit(doc.where.trim().toLowerCase()); }.toString()
  },
  {
    key: VIEWS.name,
    map: function (doc) { emit(doc.name.trim().toLowerCase()); }.toString()
  }
];

export function initViews(db) {
  return commonInitViews(db, views);
}