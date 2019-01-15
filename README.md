# About

A script finding potential reentrancies in smart contracts made possible after the Ethereum Constantinople Network Upgrade.
Using the dataset provided by [Eveem.org](http://www.eveem.org/) on BigQuery, based on the work done on https://github.com/kolinko/asterix

The code has just two simple files:

- **bigquery.py** - the main execution script
- **reentrancy.js** - the analyser function for BigQuery

# Usage

Usage:
`python3 bigquery.py`

# Requirements

You will need to sign up for cloud.google.com first, and set up the google cloud / bigquery environment:
https://cloud.google.com/bigquery/docs/quickstarts

# License
MIT
