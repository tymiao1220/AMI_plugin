import _ from 'underscore';

import router from 'girder/router';
import { restRequest } from 'girder/rest';

import AMIViewer from './views/AMIViewerSEG';

router.route('plugins/AMI/:id/view', 'histogramConfig', function (itemId, params) {
    // reconstructed url array
    restRequest({
        url: 'item/' + itemId + '/files?limit=1000'
    }).then((files) => {
        let displayUrl;
        if (files[0].exts[0] === 'nrrd') {
            displayUrl = 'api/v1/file/' + files[0]['_id'] + '/download?contentDisposition=attachment&contentType=application%2Fnrrd';
        } else {
            displayUrl = _.map(files, function (eachFile) {
                return 'api/v1/file/' + eachFile['_id'] + '/download?contentDisposition=attachment';
            });
        }
        this.amiDisplayPreview = new AMIViewer({
            el: 'body'
        });
        this.amiDisplayPreview.render(true, displayUrl);

        return null;
    });
});
