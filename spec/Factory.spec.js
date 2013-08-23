(function() {
  require(["Factory"], function(Factory) {
    return describe("Factory", function() {
      it("should exist when referenced", function() {
        return expect(Factory).toBeDefined();
      });
      it("should allow the creation of a new Factory", function() {
        var factory;
        factory = new Factory(function() {
          return this.x = true;
        });
        return expect(factory).toBeDefined();
      });
      return describe("factory instance", function() {
        var factory;
        factory = null;
        beforeEach(function() {
          return factory = new Factory(function() {
            this.x = true;
            return this.y = false;
          });
        });
        describe("define method", function() {
          beforeEach(function() {
            return factory.define("test", function() {
              return this.test = true;
            });
          });
          it("should provide define method", function() {
            return expect(factory).toProvideMethod("define");
          });
          it("should add a definition when define is called", function() {
            return expect(factory.definitions.test).toBeDefined();
          });
          it("should accept an object as the definition", function() {
            factory.define('Object', {
              test: true,
              singleton: true
            });
            return expect(factory.get('Object').test).toBe(true);
          });
          it("should throw if a definition is already defined", function() {
            var test;
            test = function() {
              return factory.define("test", function() {
                return this.test = false;
              });
            };
            return expect(test).toThrow();
          });
          return it("should allow override of a definition with override flag", function() {
            var t, test;
            test = function() {
              return factory.define("test", function() {
                return this.test = this;
              }, {
                override: true
              });
            };
            expect(test).not.toThrow();
            t = factory.get('test');
            return expect(t.test).toEqual(t);
          });
        });
        it("should provide hasDefinition method", function() {
          return expect(factory).toProvideMethod("hasDefinition");
        });
        describe("hasDefinition method", function() {
          beforeEach(function() {
            return factory.define("test", function() {
              return this.test = true;
            });
          });
          it("should provide hasDefinition method", function() {
            return expect(factory).toProvideMethod("hasDefinition");
          });
          return it("should indicate that a definition has been created", function() {
            expect(factory.hasDefinition("test")).toBe(true);
            return expect(factory.hasDefinition("nottest")).toBe(false);
          });
        });
        describe("whenDefined method", function() {
          it("should provide a whenDefined method", function() {
            return expect(factory).toProvideMethod('whenDefined');
          });
          it("should return a promise", function() {
            return expect(factory.whenDefined('SomeObject')).toBePromise();
          });
          return it("should resolve the promise when the definition is provided", function() {
            var n, promise;
            n = false;
            promise = factory.whenDefined('SomeObject');
            promise.done(function(f, name) {
              return n = {
                factory: f,
                name: name
              };
            });
            factory.define('SomeObject', {
              test: true
            });
            waitsFor(function() {
              return n;
            });
            return runs(function() {
              expect(n.factory).toEqual(factory);
              return expect(n.name).toEqual('SomeObject');
            });
          });
        });
        describe("fetchDefinition method", function() {
          it("should provide fetchDefinition method", function() {
            return expect(factory).toProvideMethod('fetchDefinition');
          });
          it("should return a promise when called", function() {
            return expect(factory.fetchDefinition('Factory')).toBePromise();
          });
          return it("should resolve the promise when the definition gets retrieved", function() {
            var n;
            n = false;
            waitsFor(function() {
              return n;
            });
            runs(function() {
              expect(factory.hasDefinition('Factory')).toBe(true);
              return expect(n).toEqual(factory);
            });
            return factory.fetchDefinition('Factory').done(function(f) {
              return n = f;
            });
          });
        });
        describe("defineMixin method", function() {
          beforeEach(function() {
            return factory.defineMixin("test", {
              test: true
            });
          });
          it("should provide defineMixin method", function() {
            return expect(factory).toProvideMethod("defineMixin");
          });
          it("should have the defined mixins", function() {
            return expect(factory.mixins.test).toBeDefined();
          });
          it("should throw if that mixin is already defined", function() {
            var test;
            test = function() {
              return factory.defineMixin('test', {
                test: false
              });
            };
            return expect(test).toThrow();
          });
          return it("should allow overriding a mixin with appropriate flag", function() {
            var test;
            test = function() {
              return factory.defineMixin('test', {
                test: false
              }, {
                override: true
              });
            };
            return expect(test).not.toThrow();
          });
        });
        it("should provide get method", function() {
          return expect(factory).toProvideMethod("get");
        });
        describe("get method", function() {
          var Test;
          Test = function(options) {
            this.initialize(options);
            return this;
          };
          Test.prototype = {
            initialize: function(options) {
              var option;
              for (option in options) {
                this[option] = options[option];
              }
              return this;
            },
            constructed: function() {
              if (this.one && this.two) {
                return this.hasConstructed = true;
              }
            }
          };
          beforeEach(function() {
            factory.defineMixin("one", {
              one: true
            });
            factory.defineMixin("two", {
              mixinitialize: function() {
                return this.two = true;
              }
            });
            return factory.define("Test", Test, {
              singleton: true,
              mixins: ["one", "two"]
            });
          });
          it("should provide a factory retrieval method on an instance", function() {
            var test;
            test = factory.get("Test", {});
            return expect(test.__factory()).toEqual(factory);
          });
          it("should return the appropriate object instance", function() {
            return expect(factory.get("Test", {})).toBeInstanceOf(Test);
          });
          it("should return a singleton if that is the option passed", function() {
            return expect(factory.get("Test")).toEqual(factory.get("Test"));
          });
          it("should mixin any requested mixins", function() {
            var test;
            test = factory.get("Test");
            expect(test.one).toBe(true);
            return expect(test.two).toBe(true);
          });
          it("should throw if you provide in invalid mixin", function() {
            var tester;
            factory.define('BadMixin', function() {
              return this.herp = true;
            }, {
              mixins: ["Doesn't Exist"]
            });
            tester = function() {
              return factory.get('BadMixin');
            };
            return expect(tester).toThrow();
          });
          it("should throw if an invalid definition is referenced", function() {
            var tester;
            tester = function() {
              return factory.get('Invalid.Object');
            };
            return expect(tester).toThrow();
          });
          return it("should have invoked the constructed method at invocation time", function() {
            var test;
            test = factory.get("Test");
            return expect(test.hasConstructed).toBe(true);
          });
        });
        describe("getConstructor method", function() {
          beforeEach(function() {
            return factory.define("ConstructorTest", function(options) {
              this.x = true;
              return this.y = options.y;
            });
          });
          it("should return a function", function() {
            return expect(typeof factory.getConstructor("ConstructorTest") === "function").toBe(true);
          });
          describe("optional original argument", function() {
            return it("should return the original constructor", function() {
              var ctor, obj;
              ctor = factory.getConstructor("ConstructorTest", true);
              obj = factory.get("ConstructorTest", {
                y: true
              });
              return expect(obj).toBeInstanceOf(ctor);
            });
          });
          it("should create the expected object when invoked", function() {
            var ctor, obj;
            ctor = factory.getConstructor("ConstructorTest");
            obj = new ctor({
              y: false
            });
            expect(obj.x).toBe(true);
            return expect(obj.y).toBe(false);
          });
          it("should support singletons", function() {
            var ctor;
            factory.define("SingletonTest", (function() {
              this.x = true;
              return this.y = false;
            }), {
              singleton: true
            });
            ctor = factory.getConstructor("SingletonTest");
            return expect(new ctor()).toEqual(new ctor());
          });
          return it("should support mixins", function() {
            var ctor;
            factory.defineMixin("Mixin.One", {
              mixinitialize: function() {
                return this.mixedin = true;
              }
            });
            factory.define("MixinTest", function() {
              return this.mixedin = false;
            }, {
              mixins: ["Mixin.One"]
            });
            ctor = factory.getConstructor("MixinTest");
            return expect((new ctor()).mixedin).toBe(true);
          });
        });
        describe("Extend", function() {
          it("should add extend capability to any constructor", function() {
            var ExtendTest;
            factory.define("ExtendTest", ExtendTest = function(options) {
              return this.test = true;
            });
            factory.extend("ExtendTest", "ExtendedObject", {
              testHandler: function() {
                return this.test;
              }
            });
            expect(factory.get("ExtendedObject").test).toBe(true);
            return expect(factory.get("ExtendedObject").testHandler()).toBe(true);
          });
          it("should throw if an invalid base class is presented", function() {
            var tester;
            tester = function() {
              return factory.extend('InvalidClass', 'OtherClass', {});
            };
            return expect(tester).toThrow();
          });
          return it("should throw if an invalid definition is presented", function() {
            var tester;
            tester = function() {
              return factory.extend('Base', 'NewThing', false);
            };
            return expect(tester).toThrow();
          });
        });
        describe("Clone", function() {
          beforeEach(function() {
            return this.clonedFactory = new Factory(function() {
              return this.cloned = true;
            });
          });
          it("shoud throw when an invalid factory is passed", function() {
            var test;
            test = function() {
              return factory.clone({});
            };
            return expect(test).toThrow();
          });
          it("should support cloning of the factory", function() {
            factory.define('Test', {
              test: true
            });
            this.clonedFactory.clone(factory);
            return expect(this.clonedFactory).not.toEqual(factory);
          });
          it("should retain it's own core implementations", function() {
            var test1, test2;
            this.clonedFactory.clone(factory);
            test1 = factory.get('Base');
            test2 = this.clonedFactory.get('Base');
            expect(test1.cloned).not.toBeDefined();
            return expect(test2.cloned).toBe(true);
          });
          it("should support getting definitions from the cloned factory", function() {
            var test;
            factory.define('Test', {
              test: true
            });
            this.clonedFactory.clone(factory);
            expect(this.clonedFactory.hasDefinition('Test')).toBe(true);
            test = this.clonedFactory.get('Test', {});
            return expect(test).toBeDefined();
          });
          it("should have it's own definition hash as well", function() {
            factory.define('Test', {
              test: true
            });
            this.clonedFactory.clone(factory);
            this.clonedFactory.define('NewTest', {
              test: true
            });
            expect(this.clonedFactory.hasDefinition('NewTest')).toBe(true);
            return expect(factory.hasDefinition('NewTest')).toBe(false);
          });
          it("should not share an instance pool with it's clone", function() {
            var test1;
            factory.define('Test', {
              test: true
            });
            this.clonedFactory.clone(factory);
            test1 = factory.get('Test');
            return expect(this.clonedFactory.instances['Test']).not.toBeDefined();
          });
          return it("should reattach any instance factory accessors to itself", function() {
            var test1, test2;
            this.clonedFactory.clone(factory);
            test1 = factory.get('Base');
            test2 = this.clonedFactory.get('Base');
            expect(test1.__factory()).toEqual(factory);
            return expect(test2.__factory()).toEqual(this.clonedFactory);
          });
        });
        return describe("Factory Instance Mapping", function() {
          var lso;
          lso = void 0;
          beforeEach(function() {
            factory.define("SimpleObject", (function() {
              return this.isSimple = true;
            }), {
              tags: ["NotSoSimple", "KindaComplicated"]
            });
            factory.extend("SimpleObject", "LessSimpleObject", {
              isThisSiple: function() {
                return !this.isSimple;
              }
            }, {
              tags: ["Difficult"]
            });
            return lso = factory.get("LessSimpleObject");
          });
          it("should be able to verify an instance map", function() {
            return expect(factory.verifyTags(lso)).toBe(true);
          });
          it("should be able to dispose of an instance", function() {
            factory.dispose(lso);
            return expect(factory.verifyTags(lso)).toBe(false);
          });
          it("should provide a dispose shortcut on the instance", function() {
            lso.__dispose();
            return expect(factory.verifyTags(lso)).toBe(false);
          });
          it("should throw if dispose is called with an invalid instance", function() {
            var tester;
            factory.dispose(lso);
            tester = function() {
              return factory.dispose(lso);
            };
            return expect(tester).toThrow();
          });
          describe("onTag", function() {
            var instances;
            instances = void 0;
            beforeEach(function() {
              return instances = _.range(0, 5).map(function() {
                return factory.get("LessSimpleObject");
              });
            });
            afterEach(function() {
              return _.invoke(instances, "__dispose");
            });
            it("should support adding tag callbacks for tags not defined yet", function() {
              var tester;
              tester = function() {
                return factory.onTag('NonExistant.Tag', function(instance) {
                  return instance.test = true;
                });
              };
              return expect(tester).not.toThrow();
            });
            it("should provide a method for modifying all instances of a tag", function() {
              return expect(factory).toProvideMethod("onTag");
            });
            it("should throw if insufficient arguments", function() {
              var insufficientArgs;
              insufficientArgs = function() {
                return factory.onTag();
              };
              return expect(insufficientArgs).toThrow();
            });
            it("should throw if non string tag passed", function() {
              var invalidArgs;
              invalidArgs = function() {
                return factory.onTag(function() {
                  return null;
                }, null);
              };
              return expect(invalidArgs).toThrow();
            });
            it("should throw if non function callback passed", function() {
              var invalidArgs;
              invalidArgs = function() {
                return factory.onTag('LessSimpleObject', [1, 2, 3]);
              };
              return expect(invalidArgs).toThrow();
            });
            it("should call the callback on all existing instances", function() {
              factory.onTag("SimpleObject", function(instance) {
                return instance.test = true;
              });
              return expect(_.chain(instances).pluck("test").all().value()).toBe(true);
            });
            it("should call the callback on any matching tags", function() {
              var reset;
              reset = function() {
                return _.each(instances, function(i) {
                  return i.test = false;
                });
              };
              return _.each(["NotSoSimple", "KindaComplicated", "LessSimpleObject", "Difficult"], function(tag) {
                factory.onTag(tag, function(i) {
                  return i.test = true;
                });
                expect(_.chain(instances).pluck("test").all().value()).toBe(true);
                return reset();
              });
            });
            return it("should call the callback on any future instances", function() {
              _.each(["SimpleObject", "NotSoSimple", "KindaComplicated", "LessSimpleObject", "Difficult"], function(tag) {
                return factory.onTag(tag, function(i) {
                  return i.test = true;
                });
              });
              return expect(factory.get("SimpleObject").test).toBe(true);
            });
          });
          describe("offTag", function() {
            it("should ignore requests to remove callbacks for non existant tags", function() {
              var test;
              test = function() {
                return factory.offTag('UndeclaredTag');
              };
              return expect(test).not.toThrow();
            });
            it("should remove the callback passed in", function() {
              var tester;
              tester = function(i) {
                return i.test = true;
              };
              factory.onTag("SimpleObject", tester);
              factory.offTag("SimpleObject", tester);
              return expect(factory.get('SimpleObject').test).not.toBeDefined();
            });
            it("should remove all callbacks if one isn't provided", function() {
              var tester;
              tester = function(i) {
                return i.test = true;
              };
              factory.onTag("SimpleObject", tester);
              factory.offTag("SimpleObject");
              return expect(factory.get('SimpleObject').test).not.toBeDefined();
            });
            it("should throw if no tag is provided", function() {
              var tester;
              tester = function() {
                return factory.offTag();
              };
              return expect(tester).toThrow();
            });
            return it("should throw if in the callback is not found", function() {
              var tester;
              tester = function() {
                factory.onTag("SimpleObject", function(i) {
                  return i.test = true;
                });
                return factory.offTag("SimpleObject", function(i) {
                  return i.test = true;
                });
              };
              return expect(tester).toThrow();
            });
          });
          describe("isType", function() {
            beforeEach(function() {
              return factory.define('aType', function() {
                return this.test = true;
              });
            });
            it("should return true if the type matches", function() {
              var instance;
              instance = factory.get('aType');
              return expect(factory.isType(instance, 'aType')).toBe(true);
            });
            return it("should return false if the type doesn't match", function() {
              var instance;
              instance = factory.get('aType');
              return expect(factory.isType(instance, 'bType')).toBe(false);
            });
          });
          return describe("getType", function() {
            beforeEach(function() {
              return factory.define('aType', function() {
                return this.test = true;
              });
            });
            return it("should return the type as a string", function() {
              var instance;
              instance = factory.get('aType');
              return expect(factory.getType(instance)).toEqual('aType');
            });
          });
        });
      });
    });
  });

}).call(this);
