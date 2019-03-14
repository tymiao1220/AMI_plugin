import os

from girder import events
from girder.models.model_base import ModelImporter
from girder import logger
from girder.api.rest import Resource,Prefix,boundHandler
from girder.api import access
from girder.api.describe import Description, describeRoute,autoDescribeRoute
from girder.models.item import Item
from girder.constants import AccessType, SortDir
from girder.models.user import User
from .models.amiAnnotation import Amiannotation
from girder.api.rest import Resource, loadmodel, filtermodel
from girder.exceptions import AccessException, ValidationException, RestException

class ami(Resource):
    def __init__(self):
        super(ami, self).__init__()
        self.resourceName = 'ami'
        self.route('GET', (), self.findAnnotation)
        self.route('GET', (':id',), self.getAnnotation)
        self.route('POST', (), self.createAnnotation)
        self.route('POST', (), self.updateSegmentation)
        self.route('DELETE', (':id',), self.deleteAnnotation)
        self.route('DELETE', (':id','AllNrrd'), self.deleteNrrdAnnotationByItem)

    @describeRoute(
        Description('Search for amiAnnotations.')
        .responseClass('Amiannotation')
        .param('itemId', 'List all amiAnnotations in this item.', required=False)
        .param('userId', 'List all amiAnnotations created by this user.',
               required=False)
        .param('text', 'Pass this to perform a full text search for '
               'amiAnnotations names and descriptions.', required=False)
        .param('name', 'Pass to lookup an amiAnnotations by exact name match.',
               required=False)
        .pagingParams(defaultSort='lowerName')
        .errorResponse()
        .errorResponse('Read access was denied on the parent item.', 403)
    )
    @access.public
    @filtermodel(model='amiAnnotation', plugin='AMI_plugin')
    def findAnnotation(self,params):

        limit, offset, sort = self.getPagingParameters(params, 'lowerName')
        query = {}
        if 'itemId' in params:
            item = Item().load(params.get('itemId'), force=True)
            Item().requireAccess(
                item, user=self.getCurrentUser(), level=AccessType.READ)
            query['itemId'] = item['_id']
        if 'userId' in params:
            user = User().load(
                params.get('userId'), user=self.getCurrentUser(),
                level=AccessType.READ)
            query['creatorId'] = user['_id']
        if params.get('text'):
            query['$text'] = {'$search': params['text']}
        if params.get('name'):
            query['Amiannotation.name'] = params['name']
        fields = list(('Amiannotation.name', 'Amiannotation.description','Amiannotation.annotation_id','Amiannotation.job_id','Amiannotation.format','Amiannotation.item_id') +
                      Amiannotation().baseFields)
        return list(Amiannotation().find(
            query, limit=limit, offset=offset, sort=sort, fields=fields))

    @describeRoute(
        Description('Update segmenation content.')
        .responseClass('Amiannotation')
        .param('fileId', 'Original file that need to be updated.', required=True)
        .param('newContent', 'New 16 bit content.',
               required=False)
        .errorResponse()
        .errorResponse('Read access was denied on the file.', 403)
    )
    @access.user
    def updateSegmentation(self, fileId, newContent):
        user = self.getCurrentUser()
        file = FileModel().load(fileId, level=AccessType.READ, user=user)
        
    @describeRoute(
        Description('Create an annotation.')
        .responseClass('Amiannotation')
        .param('itemId', 'The ID of the associated item.')
        .param('body', 'A JSON object containing the annotation.',
               paramType='body')
        .errorResponse('ID was invalid.')
        .errorResponse('Write access was denied for the item.', 403)
        .errorResponse('Invalid JSON passed in request body.')
        .errorResponse('Validation Error: JSON doesn\'t follow schema.')
    )
    @access.user
    @loadmodel(map={'itemId': 'item'}, model='item', level=AccessType.WRITE)
    @filtermodel(model='amiAnnotation', plugin='AMI_plugin')
    def createAnnotation(self, item, params):

        try:
            return Amiannotation().createAnnotation(
                item, self.getCurrentUser(), self.getBodyJson())
        except ValidationException as exc:
            logger.exception('Failed to validate annotation')
            raise RestException(exc)

    @describeRoute(
        Description('Delete an annotation.')
        .param('id', 'The ID of the annotation (fileId).', paramType='path')
        .errorResponse('ID was invalid.')
        .errorResponse('Write access was denied for the annotation.', 403)
    )
    @access.user
    # Load with a limit of 1 so that we don't bother getting most annotations
    @loadmodel(model='amiAnnotation', plugin='AMI_plugin', getElements=False)
    def deleteAnnotation(self, amiAnnotation, params):
        # Ensure that we have write access to the parent item

        item = Item().load(amiAnnotation.get('itemId'), force=True)
        if item is not None:
            Item().requireAccess(
                item, user=self.getCurrentUser(), level=AccessType.WRITE)
        Amiannotation().remove(amiAnnotation)

    @describeRoute(
        Description('Get an annotation by id.')
        .param('id', 'The ID of the annotation (fileId).', paramType='path')
        .errorResponse('ID was invalid.')
        .errorResponse('Read access was denied for the annotation.', 403)
    )
    @access.cookie
    @access.public
    @filtermodel(model='amiAnnotation', plugin='AMI_plugin')
    def getAnnotation(self, id, params):
        annotation = Amiannotation().load(id)
        # Ensure that we have read access to the parent item.  We could fail
        # faster when there are permissions issues if we didn't load the
        # annotation elements before checking the item access permissions.
        item = Item().load(annotation.get('itemId'), force=True)
        Item().requireAccess(
            item, user=self.getCurrentUser(), level=AccessType.READ)
        return annotation

    @autoDescribeRoute(
        Description('Delete all annotations of an item.')
        .modelParam('id', 'The ID of an item.', model=Item, level=AccessType.WRITE)
        .errorResponse('ID was invalid.')
        .errorResponse('Read access was denied for the annotation.', 403)
    )
    @access.user
    @filtermodel(model='amiAnnotation', plugin='AMI_plugin')
    def deleteNrrdAnnotationByItem(self,item):
        Amiannotations = Amiannotation().find({'itemId': item['_id']})
        for amiannotation in Amiannotations:
            if amiannotation['Amiannotation']['format']=='nrrd':
                Amiannotation().remove(amiannotation)
def load(info):

    logger.info(info)
    girderRoot = info['serverRoot']

    info['serverRoot'].girder = girderRoot
    info['apiRoot'].ami = ami()




