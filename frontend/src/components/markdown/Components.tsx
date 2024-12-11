
interface IComponentProps {
    content: string;
}

function Heading1({ content }: IComponentProps) {
    return <h1 className='text-6xl'>{content}</h1>;
}

function Heading2({ content }: IComponentProps) {
    return <h2 className='text-5xl'>{content}</h2>;
}

function Heading3({ content }: IComponentProps) {
    return <h3 className='text-4xl'>{content}</h3>;
}

function Heading4({ content }: IComponentProps) {
    return <h4 className='text-3xl'>{content}</h4>;
}

function Heading5({ content }: IComponentProps) {
    return <h5 className='text-2xl'>{content}</h5>;
}

function Heading6({ content }: IComponentProps) {
    return <h6 className='text-xl'>{content}</h6>;
}

function Bold({ content }: IComponentProps) {
    return <strong>{content}</strong>;
}

function Italic({ content }: IComponentProps) {
    return <em>{content}</em>;
}

function List({ content }: IComponentProps) {
    return <li>{content}</li>
}

function Text({ content }: IComponentProps) {
    return <p>{content}</p>;
}

interface IComponent {
    type: string;
    regex: RegExp[];
    component: ({ content }: IComponentProps) => JSX.Element;
    contentTransform: (line: string) => string;
}

const Components: Array<IComponent> = [
    { 'type': 'h1', 'regex': [/^# (.*$)/gim], 'component': Heading1, 'contentTransform': (line: string) => line.slice(2).trim() },
    { 'type': 'h2', 'regex': [/^## (.*$)/gim], 'component': Heading2, 'contentTransform': (line: string) => line.slice(3).trim() },
    { 'type': 'h3', 'regex': [/^### (.*$)/gim], 'component': Heading3, 'contentTransform': (line: string) => line.slice(4).trim() },
    { 'type': 'h4', 'regex': [/^#### (.*$)/gim], 'component': Heading4, 'contentTransform': (line: string) => line.slice(5).trim() },
    { 'type': 'h5', 'regex': [/^##### (.*$)/gim], 'component': Heading5, 'contentTransform': (line: string) => line.slice(6).trim() },
    { 'type': 'h6', 'regex': [/^###### (.*$)/gim], 'component': Heading6, 'contentTransform': (line: string) => line.slice(7).trim() },
    { 'type': 'bold', 'regex': [/\*\*(.*)\*\*/gim, /__(.*)__/gim], 'component': Bold, 'contentTransform': (line: string) => line.replace(/^\*{2}|(\*{2})$/g, '') },
    { 'type': 'italic', 'regex': [/\*(.*)\*/gim], 'component': Italic, 'contentTransform': (line: string) => line.replace(/^\*|(\*)$/g, '') },
    { 'type': 'list', 'regex': [/^\- /gim], 'component': List, 'contentTransform': (line: string) => line.slice(2).trim() },
    { 'type': 'text', 'regex': [/^\s*(\n)?(.+)/gim], 'component': Text, 'contentTransform': (line: string) => line }
];

export type { IComponent };
export { Components };