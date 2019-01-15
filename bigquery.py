#setting up gcloud sdk: https://cloud.google.com/sdk/docs/downloads-interactive
#pip install --upgrade google-cloud-bigquery

import json
import os

from google.cloud import bigquery

client = bigquery.Client()

def find_contracts():
    with open('reentrancy.js') as f:
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

    return query_job.to_dataframe()  # Waits for job to complete.

result = find_contracts()

result.to_pickle("result.pkl")

print(result)
