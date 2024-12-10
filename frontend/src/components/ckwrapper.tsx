import { uploadFile } from '../lib/data/api';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import 'ckeditor5/ckeditor5.css';

import {
    ClassicEditor,
    Essentials,
    Autoformat,
    Bold,
    Italic,
    BlockQuote,
    Heading, 
    Link,
    List,
    Paragraph,
    ImageInsertUI,
    CodeBlock,
    Code,
    ImageResizeEditing,
    ImageResizeHandles,
    Image,
    ImageUpload,
	Alignment,
	Autosave,
	FontSize,
	GeneralHtmlSupport,
	Highlight,
	HorizontalLine,
	ImageBlock,
	ImageInline,
	ImageResize,
	ImageStyle,
	ImageToolbar,
	ListProperties,
	PasteFromOffice,
	SelectAll,
	SpecialCharacters,
	SpecialCharactersArrows,
	SpecialCharactersCurrency,
	SpecialCharactersEssentials,
	SpecialCharactersLatin,
	SpecialCharactersMathematical,
	SpecialCharactersText,
	Strikethrough,
	Subscript,
	Superscript,
	TextTransformation,
	Underline,
	Undo
} from 'ckeditor5';



class Editor extends ClassicEditor {
    static builtinPlugins = [
        Essentials,
        BlockQuote,
        Bold,
        Italic,
        Autoformat,
        Heading,
        Link,
        List,
        Paragraph,
        Image,
        ImageUpload,
        ImageInsertUI,
        CodeBlock,
        Code,
        ImageResizeEditing,
        ImageResizeHandles,
    ];

    static defaultConfig = {
        toolbar: {
			items: [
				'undo',
				'redo',
				'|',
				'heading',
				'|',
				'fontSize',
				'|',
				'bold',
				'italic',
				'underline',
				'strikethrough',
				'subscript',
				'superscript',
				'code',
				'|',
				'ImageUpload',
				'specialCharacters',
				'horizontalLine',
				'link',
				'highlight',
				'blockQuote',
				'codeBlock',
				'|',
				'alignment',
				'|',
				'bulletedList',
				'numberedList',
				'outdent',
			],
			shouldNotGroupWhenFull: true
		},
		plugins: [
			
			Alignment,
			Autoformat,
			Autosave,
			BlockQuote,
			Bold,
			
			Code,
			CodeBlock,
			Essentials,
			FontSize,
			GeneralHtmlSupport,
			Heading,
			Highlight,
			HorizontalLine,
			ImageBlock,
			ImageInline,
			ImageResize,
			ImageStyle,
			ImageToolbar,
			ImageUpload,
			Italic,
			Link,
			List,
			ListProperties,
			Paragraph,
			PasteFromOffice,
			SelectAll,
			SpecialCharacters,
			SpecialCharactersArrows,
			SpecialCharactersCurrency,
			SpecialCharactersEssentials,
			SpecialCharactersLatin,
			SpecialCharactersMathematical,
			SpecialCharactersText,
			Strikethrough,
			Subscript,
			Superscript,
			TextTransformation,
			Underline,
			Undo
		],
		fontSize: {
			options: [10, 12, 14, 14.5, 15, 'default', 18, 20, 22, 24, 28, 30, 32],
			supportAllValues: true
		},
		image: {
			toolbar: ['imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|', 'resizeImage'],
			upload: { types: ['png', 'jpeg', 'gif'] } 
		},
		initialData:
			'CKEDITOR',
		list: {
			properties: {
				styles: true,
				startIndex: true,
				reversed: true
			}
		},
		placeholder: 'Type or paste your content here!',
	};
    };


interface CKEditorProps {
    id: string;
    data: string;
    onChange: (id: string, data: string) => void;
    onReady?: (editor: ClassicEditor) => void;
	readOnly?: boolean;
}

class MyUploadAdapter {
    loader: any;
    constructor(loader: any) {
        this.loader = loader;
    }

    async upload() {
        try {
            const file = await this.loader.file;
            const data = await uploadFile(file);
            const image_path = import.meta.env.VITE_APP_API_URL + data.url;
            return { default: image_path };
        } catch (error) {
            console.error('Upload failed', error);
            throw new Error('Upload failed');
        }
    }

    abort() {
        // Handle abort if necessary
    }
}

export const CKWrapper = (props: CKEditorProps) => {
    const { id, data, onChange, onReady, readOnly = false } = props;
	const lockId = 'CKWrapper-read-only';
    return (
        <div className="dark:text-black ck-content mb-4">
            <CKEditor
                id={id}
                data={props.data}
                editor={Editor}
                onChange={(event, editor) => {
					if (!readOnly) {
                    onChange(id, editor.getData());
				}
                }}
				//disabled
                onReady={editor => {
                    if (data) editor.setData(data);
                    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                        return new MyUploadAdapter(loader);
                    };
					if (readOnly) {
                        editor.enableReadOnlyMode(lockId);
                    } else {
                        editor.disableReadOnlyMode(lockId);
                    }
					if (document.getElementsByTagName('html')[0].className === 'dark') {
					const editorElements = document.querySelectorAll(`.ck`);
					editorElements.forEach(element => {element.classList.add('custom-ckeditor-dark'); } )
				}
                    if (onReady) onReady(editor);
                }}
            />
        </div>
    );
}

export default CKWrapper;
