from tests import base


def setUpModule():
    base.startServer()


def tearDownModule():
    base.stopServer()


class AMITestCase(base.TestCase):
    def testPlaceholder(self):
        self.assertTrue(True)
