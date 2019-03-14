import datetime
import enum
import time
import six
import json
from girder import events
from girder import logger
from girder.models.model_base import Model
from girder.constants import AccessType
from girder.exceptions import ValidationException
import jsonschema
from pymongo.errors import WriteError
class AnnotationSchema:
    annotationSchema = {
        '$schema': 'http://json-schema.org/schema#',
        'id': '/girder/plugins/AMI_plugin/models/Amiannotation',
        'type': 'object',
        'properties': {
            'name': {
                'type': 'string',
                'minLength': 1,
            },
            'description': {'type': 'string'},
            'annotation_id': {'type': 'string'},
            'job_id':{'type': 'string'},
            'format':{'type': 'string'},
            'item_id':{'type': 'string'}
        },
        'additionalProperties': False
    }

class Amiannotation(Model):
    validatorAnnotation = jsonschema.Draft4Validator(
    AnnotationSchema.annotationSchema)

    baseFields = (
        '_id',
        'itemId',
        'creatorId',
        'created',
        'updated',
        'updatedId',

    )
    def initialize(self):
        self.name = 'Amiannotation'
        self.ensureIndices(['itemId', 'created', 'creatorId'])
        self.ensureTextIndex({
            'Amiannotation.name': 10,
            'Amiannotation.description': 1
        })

        self.exposeFields(AccessType.READ, (
            'Amiannotation', '_version', '_elementQuery',
        ) + self.baseFields)

        events.bind('model.item.remove', 'ami', self._onItemRemove)

    def _onItemRemove(self, event):
        """
        When an item is removed, also delete associated annotations.

        :param event: the event with the item information.
        """
        item = event.info
        Amiannotations = Amiannotation().find({'itemId': item['_id']})
        for amiannotation in Amiannotations:
            Amiannotation().remove(amiannotation)

    def createAnnotation(self, item, creator, amiannotation):
        now = datetime.datetime.utcnow()


        doc = {
            'itemId': item['_id'],
            'creatorId': creator['_id'],
            'created': now,
            'updatedId': creator['_id'],
            'updated': now,
            'Amiannotation': amiannotation,
        }
        return self.save(doc)

    def remove(self, amiannotation, *args, **kwargs):
        """
        When removing an annotation, remove all element associated with it.
        This overrides the collection delete_one method so that all of the
        triggers are fired as expectd and cancelling from an event will work
        as needed.

        :param annotation: the annotation document to remove.
        """

        delete_one = self.collection.delete_one

        def deleteElements(query, *args, **kwargs):
            ret = delete_one(query, *args, **kwargs)
            return ret

        self.collection.delete_one = deleteElements
        result = super(Amiannotation, self).remove(amiannotation, *args, **kwargs)
        self.collection.delete_one = delete_one
        return result


    def updateAnnotation(self, amiannotation, updateUser=None):
        """
        Update an annotation.

        :param annotation: the annotation document to update.
        :param updateUser: the user who is creating the update.
        :returns: the annotation document that was updated.
        """
        amiannotation['updated'] = datetime.datetime.utcnow()
        amiannotation['updatedId'] = updateUser['_id']
        return self.save(amiannotation)


    def validate(self, doc):
        try:
            #jsonschema.validate(doc.get('Amiannotation'),AnnotationSchema.annotationSchema)
            self.validatorAnnotation.validate(doc.get('Amiannotation'))
            return doc
        except jsonschema.ValidationError as exp:
            raise ValidationException(exp)

    def save(self, document, validate=True, triggerEvents=True):
        """
        Create or update a document in the collection. This triggers two
        events; one prior to validation, and one prior to saving. Either of
        these events may have their default action prevented.

        :param document: The document to save.
        :type document: dict
        :param validate: Whether to call the model's validate() before saving.
        :type validate: bool
        :param triggerEvents: Whether to trigger events for validate and
            pre- and post-save hooks.
        """
        print "in save"
        if validate and triggerEvents:
            event = events.trigger('.'.join(('model', self.name, 'validate')),
                                   document)
            if event.defaultPrevented:
                validate = False

        if validate:
            document = self.validate(document)

        if triggerEvents:
            event = events.trigger('model.%s.save' % self.name, document)
            if event.defaultPrevented:
                return document

        isNew = '_id' not in document
        try:
            if isNew:
                print document
                document['_id'] = \
                    self.collection.insert_one(document).inserted_id
            else:
                self.collection.replace_one(
                    {'_id': document['_id']}, document, True)
        except WriteError as e:
            raise ValidationException('Database save failed: %s' % e.details)

        if triggerEvents:
            if isNew:
                events.trigger('model.%s.save.created' % self.name, document)
            events.trigger('model.%s.save.after' % self.name, document)

        return document


    def load(self, id, region=None, getElements=False, *args, **kwargs):
        """
        Load an annotation, adding all or a subset of the elements to it.

        :param region: if present, a dictionary restricting which annotations
            are returned.  See annotationelement.getElements.
        :param getElements: if False, don't get elements associated with this
            annotation.
        :returns: the matching annotation or none.
        """
        annotation = super(Amiannotation, self).load(id, *args, **kwargs)
        if annotation is not None and getElements:
            # It is possible that we are trying to read the elements of an
            # annotation as another thread is updating them.  In this case,
            # there is a chance, that between when we get the annotation and
            # ask for the elements, the version will have been updated and the
            # elements will have gone away.  To work around the lack of
            # transactions in Mongo, if we don't get any elements, we check if
            # the version has shifted under us, and, if so, requery.  I've put
            # an arbitrary retry limit on this to prevent an infinite loop.
            maxRetries = 3
            for retry in range(maxRetries):
                if (len(annotation.get('annotation', {}).get('elements')) or
                        retry + 1 == maxRetries):
                    break
                recheck = super(Amiannotation, self).load(id, *args, **kwargs)
                if (recheck is None or
                        annotation.get('_version') == recheck.get('_version')):
                    break
                annotation = recheck

        return annotation




