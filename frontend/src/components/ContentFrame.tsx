
import NoOpenNote from "./NoOpenNote";
import TabContentGroup from './TabContentGroup';
import { RootState } from "@/store";
import { TabsState } from "@/store/slices/tabsSlice";
import { useSelector } from "react-redux";


export default function ContentFrame(){
    const tabsState: TabsState = useSelector((state: RootState) => state.tabs);

    // Show TabContentGroup if there are any open tabs
    const hasOpenTabs = tabsState.openTabs.length > 0;

    if(hasOpenTabs)
        return <TabContentGroup/>;
    else
        return <NoOpenNote/>;

}