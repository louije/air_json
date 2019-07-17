/* eslint-disable no-console */

const Airtable = require("airtable");

const API_KEY = "keygVSUFNyQ6mKwjq";
const BASE_ID = "appgQyDdgqhe0caiz";
const TABLE_ID = "tblPMKSg8NaSWEzTt";
const VIEW_ID = "viwkwPzqBrppo2UHF";

class Reader {
  constructor(base, table, selectCriteria) {
    this.base = base;
    this.table = table;
    this.selectCriteria = selectCriteria || {};

    this.recordsQueue = new Set();
    this.fetchedRecords = {};
    this.tableContents = [];
  }

  nestedTable(maxDepth = 3) {
    return this.tableContents.map(row => this.nestedRow(row, maxDepth));
  }

  flatTable() {
    return {
      rows: this.tableContents,
      relations: this.relationsFor(this.tableContents)
    };
  }

  // PRIVATE

  nestedRow(rowData, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth || typeof rowData !== "object") {
      return undefined;
    }

    const updatedRow = rowData;
    Object.keys(updatedRow).forEach((k) => {
      if (this.isRelationship(updatedRow[k])) {
        updatedRow[k] = updatedRow[k].map((recID) => {
          // return this.fetchedRecords[recID] || recID;
          return this.nestedRow(this.fetchedRecords[recID], maxDepth, currentDepth + 1) || recID;
        });
      }
    });
    return updatedRow;
  }

  async fetchData() {
    const rows = [];
    const self = this;
    const promise = new Promise((resolve, reject) => {
      self.base(self.table)
        .select(self.selectCriteria)
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach((row) => {
              rows.push(self.handleRow(row.fields));
              self.hasFetched(row.id, row.fields);
            });
            fetchNextPage();
          },
          async function done(err) {
            if (err) {
              console.error(err);
              reject(err);
            }
            if (self.recordsQueue.size) {
              await self.fetchRelatedRecords();
            }
            self.tableContents = rows;
            resolve(self);
          }
        );
    });
    return promise;
  }

  handleRow(row) {
    const data = {};
    Object.keys(row).forEach((k) => {
      if (this.isRelationship(row[k])) {
        row[k].forEach(v => this.recordsQueue.add(v));
      }
      data[k] = row[k];
    });
    return data;
  }

  hasFetched(rowID, row) {
    this.fetchedRecords[rowID] = row;
    this.recordsQueue.delete(rowID);
  }

  async fetchRecord(recID) {
    const self = this;

    return new Promise((resolve, reject) => {
      this.base(self.table).find(recID, (err, record) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        self.hasFetched(record.id, record.fields);
        resolve(self);
      });
    });
  }

  async fetchRelatedRecords() {
    const promises = [...this.recordsQueue].map(id => this.fetchRecord(id));
    return Promise.all(promises);
  }

  isRelationship(key) {
    return Array.isArray(key) && key.every(v => v.slice && v.slice(0, 3) === "rec");
  }

  relationsFor(tableData) {
    const relationships = {};
    tableData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (this.isRelationship(row[k])) {
          row[k].forEach(recID => relationships[recID] = this.fetchedRecords[recID]);
        }
      });
    });
    return relationships;
  }
}

const base = new Airtable({
  apiKey: API_KEY
}).base(BASE_ID);

const reader = new Reader(base, TABLE_ID, { view: VIEW_ID });
const then = Date.now();
reader.fetchData().then(() => console.log(reader.nestedTable()[0], `${(Date.now() - then)}ms`));

// await reader.fetchData();
// return reader.nestedRable();

// table(TABLE_ID)
//   .select(["Name", "Thingie"])
//   .where({ view: VIEW_ID, filterByFormula: "{Published}" })
//   .include(["Column Name", "Column Name"])
//   .depth(2)
//   .fetch() // or .fetchSync()
