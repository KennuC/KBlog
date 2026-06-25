import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()


import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.RecentNotes({
  title: "Recent Writeups",
  limit: 5,
  showTags: true,
  linkToMore: false,
  hideTagPages: true,
  hideFolderPages: true,
  filter: (f) => !f.slug?.includes("index"),
});

ExternalPlugin.Explorer({
  folderDefaultState: "open",
  folderClickBehavior: "link",
  useSavedState: true,
  filterFn: (node) => node.name !== "404",
});