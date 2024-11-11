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
    Indent,
    Link,
    List,
    Paragraph,
    ImageInsertUI,
    CodeBlock,
    Code,
    ImageResizeEditing,
    ImageResizeHandles,
    Table,
    Image,
    TableToolbar,
    ImageUpload,
	Alignment,
	Autosave,
	FontBackgroundColor,
	FontColor,
	FontFamily,
	FontSize,
	GeneralHtmlSupport,
	Highlight,
	HorizontalLine,
	ImageBlock,
	ImageInline,
	ImageResize,
	ImageStyle,
	ImageToolbar,
	IndentBlock,
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
	TableCaption,
	TableCellProperties,
	TableColumnResize,
	TableProperties,
	TextTransformation,
	TodoList,
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
        Indent,
        Link,
        List,
        Paragraph,
        Table,
        Image,
        ImageUpload,
        ImageInsertUI,
        CodeBlock,
        Code,
        ImageResizeEditing,
        ImageResizeHandles,
        TableToolbar,
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
				'fontFamily',
				'fontColor',
				'fontBackgroundColor',
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
				'insertTable',
				'highlight',
				'blockQuote',
				'codeBlock',
				'|',
				'alignment',
				'|',
				'bulletedList',
				'numberedList',
				'todoList',
				'outdent',
				'indent'
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
			FontBackgroundColor,
			FontColor,
			FontFamily,
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
			Indent,
			IndentBlock,
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
			Table,
			TableCaption,
			TableCellProperties,
			TableColumnResize,
			TableProperties,
			TableToolbar,
			TextTransformation,
			TodoList,
			Underline,
			Undo
		],
		fontFamily: {
			supportAllValues: true
		},
		fontSize: {
			options: [10, 12, 14, 'default', 18, 20, 22],
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
		table: {
			contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
		}
	};
    };


interface CKEditorProps {
    id: string;
    data: string;
    onChange: (id: string, data: string) => void;
    onReady?: (editor: ClassicEditor) => void;
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
    const { id, data, onChange, onReady } = props;
    return (
        <div className="dark:text-black ck-content">
            <CKEditor
                id={id}
                data={props.data}
                editor={Editor}
                onChange={(event, editor) => {
                    onChange(id, editor.getData());
                }}
                onReady={editor => {
                    if (data) editor.setData(data);
                    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
                        return new MyUploadAdapter(loader);
                    };
                    if (onReady) onReady(editor);
                }}
            />
        </div>
    );
}

export default CKWrapper;
