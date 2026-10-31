import { notFound } from "next/navigation";
import { Editor, Analysis, Design, Compare, Report } from "@/features/workspace-pages";
export default async function Page({params}:{params:Promise<{projectId:string;section:string}>}) {
  const {projectId,section}=await params;if(projectId!=="singapore")notFound();
  switch(section){case "editor":return <Editor/>;case "analysis":return <Analysis/>;case "design":return <Design/>;case "compare":return <Compare/>;case "report":return <Report/>;default:notFound();}
}
