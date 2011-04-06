
/**
 * Module dependencies.
 */

var jade = require('jade'),
    Compiler = jade.Compiler,
    render = jade.render,
    nodes = jade.nodes;

jade.filters.conditionals = function(block, compiler){
    return new Visitor(block).compile();
};

function Visitor(node) {
    this.node = node;
}

Visitor.prototype.__proto__ = Compiler.prototype;

Visitor.prototype.visit = function(node){
    if (node.name != 'else') this.line(node);
    this.visitNode(node);
};

Visitor.prototype.visitTag = function(node){
  switch (node.name) {
    case 'if':
      // First text -> line
      var condition = node.text[0]
        , block = node.block;
      node = new nodes.Code('if (' + condition + ')');
      node.block = block;
      this.visit(node);
      break;
    case 'else':
      var block = node.block;
      node = new nodes.Code('else');
      node.block = block;
      node.instrumentLineNumber = false;
      this.visit(node);
      break;
    default:
      Compiler.prototype.visitTag.call(this, node);
  }
};

module.exports = {
    'test :cdata filter': function(assert){
      assert.equal('<![CDATA[\nfoo\n]]>', render(':cdata\n  foo'));
      assert.equal('<![CDATA[\nfoo\nbar\n]]>', render(':cdata\n  foo\n  bar'));
      assert.equal('<![CDATA[\nfoo\nbar\n]]><p>something else</p>', render(':cdata\n  foo\n  bar\np something else'));
    },
    
    'test :markdown filter': function(assert){
        assert.equal(
            '<h1>foo</h1>\n\n<ul><li>bar</li><li>baz</li></ul>',
            render(':markdown\n  #foo\n  - bar\n  - baz\n'))
    },
    
    'test :stylus filter': function(assert){
        assert.equal(
            '<style>body {\n  color: #c00;\n}\n</style>',
            render(':stylus\n  body\n    color #c00'));
    },

    'test :less filter': function(assert){
        assert.equal(
            '<style>.class {\n  width: 20px;\n}\n</style>',
            render(':less\n  .class { width: 10px * 2 }\n'));
    },

    'test :coffeescript filter': function(assert){
        var js = [
            '(function() {',
            '  var square;',
            '  square = function(x) {',
            '    return x * x;',
            '  };',
            '}).call(this);'
        ].join('\n');

        assert.equal(
            '<script type="text/javascript">\n' + js + '\n</script>',
            render(':coffeescript\n  square = (x) ->\n    x * x'));

        assert.equal('<script type="text/javascript">\n(function() {\n  alert(\'test\');\n}).call(this);\n</script>'
          , render(":coffeescript\n  alert 'test'"));
    },
    
    'test parse tree': function(assert){
        var str = [
            'conditionals:',
            '  if false',
            '    | oh noes',
            '  else',
            '    if null == false',
            '      p doh',
            '    else',
            '      p amazing!'
        ].join('\n');
    
        var html = [
            '<p>amazing!</p>'
        ].join('');
    
        assert.equal(html, render(str));
    },
    
    'test filter attrs': function(assert){
        jade.filters.testing = function(str, attrs){
          return str + ' ' + attrs.stuff;
        };

        var str = [
            ':testing(stuff)',
            '  foo bar',
        ].join('\n');

        assert.equal('foo bar true', render(str));
     } 
};