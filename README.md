# AirJSON

A wrapper for [Airtable](https://airtable.com)’s [JavaScript API](https://github.com/Airtable/airtable.js) that will also fetch the related entries of the rows it returns.

## Usage

```javascript
const AirJSON = require("air_json");

// Configuration.
const myTable = new AirJSON({
  // Airtable credentials. Required.
  apiKey: API_KEY,

  // Base ID and table ID. Required.
  baseID: BASE_ID,
  tableID: TABLE_ID,

  // Any parameters the Airtable API normally accepts:
  // fields, filterByFormula, maxRecords,
  // pageSize, sort, view, timeZone, userLocale
  // Cf. https://airtable.com/api
  // Optional.
  fields: ["Only", "Fetch", "These", "Fields"],
  view: RESTRICT_TO_RECORDS_IN_THIS_VIEW_ID,
  filterByFormula: "NOT({Title} = '')",

  // When set, will only fetch related records on
  // fields named here. Otherwise will return an array
  // of "rec123456789" identifiers (Airtable API default).
  // When not set, all linked records are fetched.
  // Optional. Defaults to undefined.
  relationshipFields: ["Linked Records 1", "Liked Table 2"]
});
```

### Output format nº1: `nested()`
```javascript
// Fetch the table and nest its linked records.
myTable.fetch().then(t => console.log(t.nested()));

// Returns:
[
  {
    "Title": "Record 1 Title",
    "Members": [ // Link to another table
      {
        "Name": "Andrea Member",
        ...
      },
      {
        "Name": "Basil Member",
        ...
      }
    ],
    ...
  }
]
```
By default, `myTable.nested()` will nest records one level deep (should the linked record link back to the one linking to it, for instance). The degree of nesting can be increased: `myTable.nested(3)`.


### Output format nº2: `flat()`
```javascript
// Fetch the table and return a flat list of its linked records.
myTable.fetch().then(t => console.log(t.flat()));

// Returns:
{
  rows: [
    {
      "Title": "Record 1 Title",
      "Members": ["rec12345", "rec67890"]
    },
    ...
  ],
  relations: {
    "rec12345": {
      "Name": "Andrea Member",
      ...
    },
    "rec67890": {
      "Name": "Basil Member",
      ...
    }
  }
}

```

## Reasoning

The goal of this script is to ease the use of Airtable as a "headless" CMS.

---

## Questions

Help, questions, bug reports, tests, enhancements are most welcome.


## Known and unknown issues

- The Airtable.js lib is supposed to take care of rate limiting. If not, as this script fetches each linked record individually, some form of queuing should be implemented.
- Linked records of linked records are only fetched if they are also linked from the queried table. Downloading an entire Airtable base as a tree is not yet supported.

