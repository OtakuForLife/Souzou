import {MarkdownEditor} from '../components/markdown/Editor';

export default function Test(){
    const markdown = `

# h1 Heading
## h2 Heading
### h3 Heading
#### h4 Heading
##### h5 Heading
###### h6 Heading
`;
    return(
        <MarkdownEditor initialContent={markdown}/>
    );
}