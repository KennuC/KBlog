import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import * as ExternalPlugin from "./.quartz/plugins";

ExternalPlugin.RecentNotes({
  title: "Recent Writeups",
  limit: 5,
  showTags: true,
  linkToMore: false,
  hideTagPages: true,
  hideFolderPages: true,
  filter: (f) => f.slug !== "404" && f.frontmatter?.title !== "Not Found",
});

ExternalPlugin.Explorer({
  folderDefaultState: "open",
  folderClickBehavior: "link",
  useSavedState: true,
  filterFn: (node) => node.slugSegment !== "404" && node.slugSegment !== "assets",
});

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
