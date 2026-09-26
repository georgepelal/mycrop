import React from "react";
import { AlertOctagon } from "lucide-react";

interface Props {
  /** Remounts the boundary when the tool or its location changes. */
  resetKey: string;
  toolName: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a crash inside a tool and says so, instead of blanking the page.
 *
 * The common cause is a response that arrives with a 200 but not the shape the
 * page expects, so the page reads a field off something undefined. Showing an
 * honest failure is the point: the alternative is a white screen that looks
 * like the tool has no data rather than like something went wrong.
 */
export default class ToolErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error) {
    console.error("Tool crashed:", this.props.toolName, error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2.5 px-6 py-20 text-center">
        <AlertOctagon className="h-8 w-8 text-rose-400" />
        <h2 className="text-sm font-display font-black text-slate-900 dark:text-slate-100">
          {this.props.toolName} could not display this result
        </h2>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          The data source answered, but not with what this tool expected, so
          there is nothing reliable to show. Try another location, or come back
          later.
        </p>
        <code className="mt-1 max-w-full overflow-hidden text-ellipsis rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {this.state.error.message}
        </code>
      </div>
    );
  }
}
