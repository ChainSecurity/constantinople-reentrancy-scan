#setting up gcloud sdk: https://cloud.google.com/sdk/docs/downloads-interactive
#pip install --upgrade google-cloud-bigquery

import json
import os

from google.cloud import bigquery

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = 'creds.json' 


client = bigquery.Client()

def find_contracts():
    with open('helpers.js') as f:
        helpers = f.read()

    with open('reentrancy2.js') as f:
        script = f.read()

    query_job = client.query(
        '''
        create temp function showme(contract STRING)
        returns ARRAY<STRING>
        LANGUAGE js AS
            """
            '''+script+'''
            """;

        SELECT addr, showme(contract) as a FROM `showme-1389.eveem.contracts` where ARRAY_LENGTH(showme(contract)) > 0
        ''')

    results = query_job.result()  # Waits for job to complete.

    for row in results:
        print(row[0])
        for r in row[1]:
            d = json.loads(r)
            print(d['func_name'])
            print(d['print'])
            print(d['res'])
            print()
        print()

result = find_contracts()

result.to_pickle("result.pkl")

print(result)
