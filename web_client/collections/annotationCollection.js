import Collection from 'girder/collections/Collection';

import AnnotationModel from '../models/annotationModel';

export default Collection.extend({
    resourceName: 'ami',
    model: AnnotationModel,
    pageLimit: 100
});
