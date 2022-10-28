/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see https://ckeditor.com/legal/ckeditor-oss-license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
	config.extraPlugins = 'image2,codesnippet';
	config.image2_initial_width = 300;
    config.image2_initial_height = 300;
	config.image2_maxSize = {
		height: 300,
		width: 250
	};
	config.image2_defaultLockRatio = 'true';
