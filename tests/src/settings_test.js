/* eslint-disable */
import Settings from '../../src/common/settings';

export default function() {
  QUnit.test("Simple set and get", function (assert) {
    const settings = new Settings();
    settings.set("test", 1);
    assert.equal(settings.get("test"), 1)
  });

  QUnit.test("Set multiple", function (assert) {
    const settings = new Settings();
    settings.set("foo", 1);
    settings.set("bar", 2);
    settings.set("baz", 3);
    assert.equal(settings.get("foo"), 1);
    assert.equal(settings.get("bar"), 2);
    assert.equal(settings.get("baz"), 3);
  });

  localStorage.clear();
  QUnit.test("Set in localStorage", function (assert) {
    const settings = new Settings();
    settings.set("foo", 1);
    settings.cache = {};
    assert.equal(settings.get("foo"), 1);
  });

  QUnit.test("Get from default", function (assert) {
    const settings = new Settings({ "foo": 1 });
    assert.equal(settings.get("foo"), 1);
  });

  QUnit.test("Get null if not set", function (assert) {
    const settings = new Settings();
    assert.equal(settings.get("not-set"), null);
  });
}
