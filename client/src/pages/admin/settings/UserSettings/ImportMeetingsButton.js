import React from 'react';
import { useMutation } from '@apollo/client';
import { IMPORT_GOOGLE_MEETINGS } from '../../../../utils/graphql/gcal/queries.js';

export default function ImportMeetingsButton() {
    let [importGoogleMeetings, {data, loading }] = useMutation(IMPORT_GOOGLE_MEETINGS);

    const handleImport = async () => {
        try {
            data = await importGoogleMeetings();
            const result = data?.importGoogleMeetings;
            alert(`Import completed:\nImported: ${result.imported}\nSkipped: ${result.skipped}\nExpired: ${result.expired}\nUpdated: ${result.updated}`);
        } catch (error) {
            alert("Error importing meetings: " + error.message);
        }
    }
    return (
        <button
            onClick={handleImport}
            disabled={loading}
            className="btn btn-primary"
        >
            {loading ? 'Importing…' : 'Import Google Meetings'}
        </button>
    );
};
