const Airtable = require("airtable");

class AirJSON {
  constructor(params = {}) {
    [
      this.config,
      this.relationshipFields,
      this.criteria
    ] = this._configure(params);

    this.recordsQueue = new Set();
    this.fetchedRecords = {};
    this.tableContents = [];

    this.base = new Airtable({ apiKey: this.config.apiKey }).base(this.config.baseID);
    return this;
  }

  // FETCHING AND JSON OUTPUT

  fetch() {
    return this._fetchData();
  }

  nested(maxDepth = 3) {
    return this.tableContents.map(row => this._nestedRow(row, maxDepth));
  }

  flat() {
    return {
      rows: this.tableContents,
      relations: this._relationsFor(this.tableContents)
    };
  }

  // PRIVATE

  _configure(params) {
    const reservedKeys = ["apiKey", "baseID", "tableID", "relationshipFields"];

    const config = {
      apiKey: params.apiKey,
      baseID: params.baseID,
      tableID: params.tableID
    };
    const { relationshipFields } = params;

    const criteriaKeys = Object.keys(params).filter(k => reservedKeys.indexOf(k) === -1);
    const criteria = criteriaKeys.reduce((obj, key) => {
      obj[key] = params[key]; // eslint-disable-line no-param-reassign
      return obj;
    }, {});

    return [config, relationshipFields, criteria];
  }

  _nestedRow(rowData, maxDepth = 1, currentDepth = 0) {
    if (currentDepth >= maxDepth || typeof rowData !== "object") {
      return undefined;
    }

    const updatedRow = Object.assign({}, rowData); // Clone object
    Object.keys(updatedRow).forEach((k) => {
      if (this._isRelationship(k, updatedRow[k])) {
        updatedRow[k] = updatedRow[k].map((recID) => {
          return this._nestedRow(this.fetchedRecords[recID], maxDepth, currentDepth + 1) || recID;
        });
      }
    });
    return updatedRow;
  }

  async _fetchData() {
    const rows = [];
    const self = this;
    const promise = new Promise((resolve, reject) => {
      self.base(self.config.tableID)
        .select(self.criteria)
        .eachPage(
          function page(records, fetchNextPage) {
            records.forEach((row) => {
              rows.push(self._handleRow(row.fields));
              self._hasFetched(row.id, row.fields);
            });
            fetchNextPage();
          },
          async function done(err) {
            if (err) {
              console.error(err);
              reject(err);
            }
            if (self.recordsQueue.size) {
              await self._fetchRelatedRecords();
            }
            self.tableContents = rows;
            resolve(self);
          }
        );
    });
    return promise;
  }

  _handleRow(row) {
    const data = {};
    Object.keys(row).forEach((k) => {
      if (this._isRelationship(k, row[k])) {
        row[k].forEach(v => this.recordsQueue.add(v));
      }
      data[k] = row[k];
    });
    return data;
  }

  _hasFetched(rowID, row) {
    this.fetchedRecords[rowID] = row;
    this.recordsQueue.delete(rowID);
  }

  async _fetchRecord(recID) {
    const self = this;

    return new Promise((resolve, reject) => {
      this.base(self.config.tableID).find(recID, (err, record) => {
        if (err) {
          console.error(err);
          reject(err);
        }
        self._hasFetched(record.id, record.fields);
        resolve(self);
      });
    });
  }

  async _fetchRelatedRecords() {
    const promises = [...this.recordsQueue].map(id => this._fetchRecord(id));
    return Promise.all(promises);
  }

  _isRelationship(key, val) {
    if (Array.isArray(this.relationshipFields) && this.relationshipFields.indexOf(key) !== -1) {
      return false;
    }
    return Array.isArray(val) && val.every(r => r.slice && r.slice(0, 3) === "rec");
  }

  _relationsFor(tableData) {
    const relationships = {};
    tableData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (this._isRelationship(k, row[k])) {
          row[k].forEach(recID => (relationships[recID] = this.fetchedRecords[recID]));
        }
      });
    });
    return relationships;
  }
}

module.exports = AirJSON;
