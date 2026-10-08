"use client";

import TopBar from "./TopBar";
import ToolSidebar from "./ToolSidebar";
import MediaPanel from "./MediaPanel";
import PreviewPanel from "./PreviewPanel";
import PropertiesPanel from "./PropertiesPanel";

import Timeline from "./timeline/Timeline";

import {
    useEditor,
} from "@/hooks/useEditor";

export default function Editor() {
    const editor =
        useEditor();

    return (
        <main className="h-screen overflow-hidden bg-[#090B0F] text-[#F4F4F5] select-none">

            <input
                ref={
                    editor.fileInputRef
                }
                type="file"
                accept="video/*"
                multiple
                onChange={
                    editor.importMedia
                }
                className="hidden"
            />

            <TopBar
                canUndo={
                    editor.canUndo
                }
                canRedo={
                    editor.canRedo
                }
                onUndo={
                    editor.undo
                }
                onRedo={
                    editor.redo
                }
            />

            <div className="flex h-[calc(100vh-56px)] flex-col">

                <div className="flex flex-1 min-h-0">

                    <ToolSidebar />

                    <MediaPanel
                        mediaItems={
                            editor.mediaItems
                        }
                        isImporting={
                            editor.isImporting
                        }
                        onImport={() =>
                            editor.fileInputRef.current?.click()
                        }
                        onAddToTrack={
                            editor.addMediaToTrack
                        }
                    />

                    <PreviewPanel
                        v1VideoRef={
                            editor.v1VideoRef
                        }

                        v2VideoRef={
                            editor.v2VideoRef
                        }

                        activeV1Media={
                            editor.activeV1Media
                        }

                        activeV2Media={
                            editor.activeV2Media
                        }

                        v1Visible={
                            editor.v1Visible
                        }

                        v2Visible={
                            editor.v2Visible
                        }

                        audioMuted={
                            editor.audioMuted
                        }

                        isPlaying={
                            editor.isPlaying
                        }

                        currentTime={
                            editor.currentTime
                        }

                        projectDuration={
                            editor.projectDuration
                        }

                        onTogglePlay={
                            editor.togglePlay
                        }

                        onV1TimeUpdate={
                            editor.handleV1TimeUpdate
                        }

                        onV1LoadedMetadata={
                            editor.handleV1LoadedMetadata
                        }

                        onV2LoadedMetadata={
                            editor.handleV2LoadedMetadata
                        }
                    />

                    <PropertiesPanel />

                </div>

                <Timeline
                    clips={
                        editor.timelineClips
                    }

                    selectedClipId={
                        editor.selectedClipId
                    }

                    currentTime={
                        editor.currentTime
                    }

                    projectDuration={
                        editor.projectDuration
                    }

                    pixelsPerSecond={
                        editor.pixelsPerSecond
                    }

                    zoom={
                        editor.zoom
                    }

                    v1Visible={
                        editor.v1Visible
                    }

                    v2Visible={
                        editor.v2Visible
                    }

                    audioMuted={
                        editor.audioMuted
                    }

                    locked={
                        editor.tracksLocked
                    }

                    v1Height={
                        editor.v1Height
                    }

                    v2Height={
                        editor.v2Height
                    }

                    audioHeight={
                        editor.audioHeight
                    }

                    getFrames={
                        editor.getFrames
                    }

                    getWaveform={
                        editor.getWaveform
                    }

                    onSelectClip={
                        editor.selectClip
                    }

                    onTimelineClick={
                        editor.seekTimelineFromMouse
                    }

                    onDragStart={
                        editor.startClipDrag
                    }

                    onTrimStart={
                        editor.startTrim
                    }

                    onTrackResize={
                        editor.startTrackResize
                    }

                    onSplit={
                        editor.splitAtPlayhead
                    }

                    onDelete={
                        editor.deleteSelectedClip
                    }

                    onRippleDelete={
                        editor.rippleDeleteSelectedClip
                    }

                    onZoomIn={
                        editor.zoomIn
                    }

                    onZoomOut={
                        editor.zoomOut
                    }

                    onToggleV1={() =>
                        editor.setV1Visible(
                            !editor.v1Visible
                        )
                    }

                    onToggleV2={() =>
                        editor.setV2Visible(
                            !editor.v2Visible
                        )
                    }

                    onToggleAudio={() =>
                        editor.setAudioMuted(
                            !editor.audioMuted
                        )
                    }

                    onToggleLock={() =>
                        editor.setTracksLocked(
                            !editor.tracksLocked
                        )
                    }
                />

            </div>

        </main>
    );
}