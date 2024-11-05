import { uploadFile } from '../lib/data/api';
import { CKEditor } from '@ckeditor/ckeditor5-react';


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
    ImageUpload
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

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
                '|', 'heading',
                '|', 'bold', 'italic',
                '|', 'link', 'insertTable', 'blockQuote',
                '|', 'bulletedList', 'numberedList', 'outdent', 'indent',
                '|', 'Code', 'CodeBlock', 'Autoformat',
                '|', 'ImageUpload', 'ImageResizeEditing', 'ImageResizeHandles',
                '|', 'toggleImageCaption',
            ]
        },
        resizeOptions: [
            { name: 'resizeImage:original', value: null, label: 'Original' },
            { name: 'resizeImage:25', value: '25', label: '25%' },
            { name: 'resizeImage:50', value: '50', label: '50%' },
            { name: 'resizeImage:75', value: '75', label: '75%' }
        ],
        image: { upload: { types: ['png', 'jpeg', 'gif'] } },
        language: 'en',
    };
}

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
        <div className="dark:text-black">
            <CKEditor
                id={id}
                data={data}
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
