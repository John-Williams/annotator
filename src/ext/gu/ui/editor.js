"use strict";

var util = require('../../../util');

var $ = util.$;
var _t = util.gettext;
var Promise = util.Promise;

var NS = "annotator-editor";

// Public: Creates an element for editing annotations.
var Editor = exports.Editor = function (options) {
    this.options = options || {};
    this.element = this.options.element || null; // provide from app??
    this.element = $(this.element);
    
    this.fields = [];
    this.annotation = {};

    var self = this;

    this.element
        .on("submit." + NS, 'form', function (e) {
            self._onFormSubmit(e);
        })
        .on("click." + NS, '.annotator-save', function (e) {
            self._onSaveClick(e);
        })
        .on("click." + NS, '.annotator-cancel', function (e) {
            self._onCancelClick(e);
        })
        .on("mouseover." + NS, '.annotator-cancel', function (e) {
            self._onCancelMouseover(e);
        })
        .on("keydown." + NS, 'textarea', function (e) {
            self._onTextareaKeydown(e);
        });
}

$.extend(Editor, {

    destroy: function () {
        this.element.off("." + NS);
        Widget.prototype.destroy.call(this);
    },

    show: function (position) {
    },

    // Public: Load an annotation into the editor and display it.
    //
    // annotation - An annotation Object to display for editing.
    // position - An Object specifying the position in which to show the editor
    //            (optional).
    //
    // Returns a Promise that is resolved when the editor is submitted, or
    // rejected if editing is cancelled.
    load: function (annotation, position) {
        this.annotation = annotation;

        for (var i = 0, len = this.fields.length; i < len; i++) {
            var field = this.fields[i];
            field.load(field.element, this.annotation);
        }

        var self = this;
        return new Promise(function (resolve, reject) {
            self.dfd = {resolve: resolve, reject: reject};
            self.show(position);
        });
    },

    // Public: Submits the editor and saves any changes made to the annotation.
    //
    // Returns nothing.
    submit: function () {
        for (var i = 0, len = this.fields.length; i < len; i++) {
            var field = this.fields[i];
            field.submit(field.element, this.annotation);
        }
        if (typeof this.dfd !== 'undefined' && this.dfd !== null) {
            this.dfd.resolve();
        }
        this.hide();
    },

    // Public: Cancels the editing process, discarding any edits made to the
    // annotation.
    //
    // Returns itself.
    cancel: function () {
        if (typeof this.dfd !== 'undefined' && this.dfd !== null) {
            this.dfd.reject('editing cancelled');
        }
        this.hide();
    },

    // Public: Adds an additional form field to the editor. Callbacks can be
    // provided to update the view and anotations on load and submission.
    //
    // options - An options Object. Options are as follows:
    //           id     - A unique id for the form element will also be set as
    //                    the "for" attribute of a label if there is one.
    //                    (default: "annotator-field-{number}")
    //           type   - Input type String. One of "input", "textarea",
    //                    "checkbox", "select" (default: "input")
    //           label  - Label to display either in a label Element or as
    //                    placeholder text depending on the type. (default: "")
    //           load   - Callback Function called when the editor is loaded
    //                    with a new annotation. Receives the field <li> element
    //                    and the annotation to be loaded.
    //           submit - Callback Function called when the editor is submitted.
    //                    Receives the field <li> element and the annotation to
    //                    be updated.
    //
    // Examples
    //
    //   # Add a new input element.
    //   editor.addField({
    //     label: "Tags",
    //
    //     # This is called when the editor is loaded use it to update your
    //     # input.
    //     load: (field, annotation) ->
    //       # Do something with the annotation.
    //       value = getTagString(annotation.tags)
    //       $(field).find('input').val(value)
    //
    //     # This is called when the editor is submitted use it to retrieve data
    //     # from your input and save it to the annotation.
    //     submit: (field, annotation) ->
    //       value = $(field).find('input').val()
    //       annotation.tags = getTagsFromString(value)
    //   })
    //
    //   # Add a new checkbox element.
    //   editor.addField({
    //     type: 'checkbox',
    //     id: 'annotator-field-my-checkbox',
    //     label: 'Allow anyone to see this annotation',
    //     load: (field, annotation) ->
    //       # Check what state of input should be.
    //       if checked
    //         $(field).find('input').attr('checked', 'checked')
    //       else
    //         $(field).find('input').removeAttr('checked')

    //     submit: (field, annotation) ->
    //       checked = $(field).find('input').is(':checked')
    //       # Do something.
    //   })
    //
    // Returns the created <li> Element.
    addField: function (options) {
        var field = $.extend({
            id: 'annotator-field-' + id(),
            type: 'input',
            label: '',
            load: function () {},
            submit: function () {}
        }, options);

        var input = null,
            element = $('<li class="annotator-item" />');

        field.element = element[0];

        if (field.type === 'textarea') {
            input = $('<textarea />');
        } else if (field.type === 'checkbox') {
            input = $('<input type="checkbox" />');
        } else if (field.type === 'input') {
            input = $('<input />');
        } else if (field.type === 'select') {
            input = $('<select />');
        }

        element.append(input);

        input.attr({
            id: field.id,
            placeholder: field.label
        });

        if (field.type === 'checkbox') {
            element.addClass('annotator-checkbox');
            element.append($('<label />', {
                'for': field.id,
                'html': field.label
            }));
        }

        this.element.find('ul:first').append(element);
        this.fields.push(field);

        return field.element;
    },

    checkOrientation: function () {
        Widget.prototype.checkOrientation.call(this);

        var list = this.element.find('ul').first(),
            controls = this.element.find('.annotator-controls');

        if (this.element.hasClass(this.classes.invert.y)) {
            controls.insertBefore(list);
        } else if (controls.is(':first-child')) {
            controls.insertAfter(list);
        }

        return this;
    },

    // Event callback: called when a user clicks the editor form (by pressing
    // return, for example).
    //
    // Returns nothing
    _onFormSubmit: function (event) {
        preventEventDefault(event);
        this.submit();
    },

    // Event callback: called when a user clicks the editor's save button.
    //
    // Returns nothing
    _onSaveClick: function (event) {
        preventEventDefault(event);
        this.submit();
    },

    // Event callback: called when a user clicks the editor's cancel button.
    //
    // Returns nothing
    _onCancelClick: function (event) {
        preventEventDefault(event);
        this.cancel();
    },

    // Event callback: called when a user mouses over the editor's cancel
    // button.
    //
    // Returns nothing
    _onCancelMouseover: function () {
        this.element
            .find('.' + this.classes.focus)
            .removeClass(this.classes.focus);
    },

    // Event callback: listens for the following special keypresses.
    // - escape: Hides the editor
    // - enter:  Submits the editor
    //
    // event - A keydown Event object.
    //
    // Returns nothing
    _onTextareaKeydown: function (event) {
        if (event.which === 27) {
            // "Escape" key => abort.
            this.cancel();
        } else if (event.which === 13 && !event.shiftKey) {
            // If "return" was pressed without the shift key, we're done.
            this.submit();
        }
    }
});

// Classes to toggle state.
Editor.classes = {
    hide: 'annotator-hide',
    focus: 'annotator-focus'
};

// HTML template for this.element.
Editor.template = [
    '<div class="annotator-outer annotator-editor annotator-hide">',
    '  <form class="annotator-widget">',
    '    <ul class="annotator-listing"></ul>',
    '    <div class="annotator-controls">',
    '     <a href="#cancel" class="annotator-cancel">' + _t('Cancel') + '</a>',
    '      <a href="#save"',
    '         class="annotator-save annotator-focus">' + _t('Save') + '</a>',
    '    </div>',
    '  </form>',
    '</div>'
].join('\n');

// Configuration options
Editor.options = {
    // Add the default field(s) to the editor.
    defaultFields: true
};