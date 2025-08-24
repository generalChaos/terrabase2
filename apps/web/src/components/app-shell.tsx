'use client';
import { ReactNode, useState } from 'react';
import { TimerRing } from './games/shared/ui';
import { Button } from './ui/button';
import { Copy, QrCode, X, Check } from 'lucide-react';

export function AppShell({
  right,
  timer,
  children,
  sub,
  roomCode,
}: {
  right?: ReactNode;
  timer?: { seconds: number; total: number } | null;
  children?: ReactNode;
  sub?: ReactNode;
  roomCode?: string;
}) {
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const copyToClipboard = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/join/${roomCode}`);
        setShowCopiedToast(true);
        setTimeout(() => setShowCopiedToast(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  return (
    <>
      {/* Header Section */}
      <header 
        id="app-header"
        data-component="AppHeader"
        className="text-center mb-6"
      >
        {/* Main Title */}
        <h1 
          id="app-title"
          data-component="AppTitle"
          className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg font-bangers"
        >
          Party Game
        </h1>

        {/* Room Code Button */}
        {roomCode && (
          <Button
            id="room-code-button"
            data-component="RoomCodeButton"
            data-room-code={roomCode}
            variant="secondary"
            size="md"
            onClick={() => setShowRoomModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/30"
          >
            <QrCode className="w-4 h-4 mr-2" />
            Room Code: {roomCode}
          </Button>
        )}

        {/* Right side content (timer, etc.) */}
        {(timer || right) && (
          <div 
            id="header-actions"
            data-component="HeaderActions"
            className="flex items-center justify-center gap-4 mt-3"
          >
            {timer && <TimerRing seconds={timer.seconds} total={timer.total} />}
            {right}
          </div>
        )}
      </header>

      {/* Sub content */}
      {sub && (
        <div 
          id="app-subtitle"
          data-component="AppSubtitle"
          className="text-center mb-6 text-sm opacity-80"
        >
          {sub}
        </div>
      )}

      {/* Children content - only render if provided */}
      {children && (
        <main 
          id="app-main"
          data-component="AppMain"
        >
          {children}
        </main>
      )}

      {/* Room Code Modal */}
      {showRoomModal && roomCode && (
        <div 
          id="room-code-modal"
          data-component="RoomCodeModal"
          data-room-code={roomCode}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            id="modal-content"
            data-component="ModalContent"
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-600"
          >
            {/* Modal Header */}
            <div 
              id="modal-header"
              data-component="ModalHeader"
              className="flex items-center justify-between mb-4"
            >
              <h3 
                id="modal-title"
                data-component="ModalTitle"
                className="text-xl font-bold text-white"
              >
                Room Code
              </h3>
              <button
                id="modal-close-button"
                data-component="ModalCloseButton"
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Code Display */}
            <div 
              id="room-code-display"
              data-component="RoomCodeDisplay"
              className="bg-slate-900 rounded-xl p-4 mb-4 text-center"
            >
              <div 
                id="room-code-text"
                data-component="RoomCodeText"
                className="text-3xl font-mono font-bold text-white mb-2"
              >
                {roomCode}
              </div>
              <div 
                id="room-code-description"
                data-component="RoomCodeDescription"
                className="text-sm text-gray-400"
              >
                Share this code with friends to join
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div 
              id="qr-code-section"
              data-component="QRCodeSection"
              className="bg-slate-900 rounded-xl p-8 mb-4 text-center"
            >
              <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <div 
                id="qr-code-label"
                data-component="QRCodeLabel"
                className="text-sm text-gray-400"
              >
                QR Code for {roomCode}
              </div>
              <div 
                id="qr-code-note"
                data-component="QRCodeNote"
                className="text-xs text-gray-500 mt-1"
              >
                (QR code generation coming soon)
              </div>
            </div>

            {/* Action Buttons */}
            <div 
              id="modal-actions"
              data-component="ModalActions"
              className="flex gap-3"
            >
              <Button
                id="copy-link-button"
                data-component="CopyLinkButton"
                variant="primary"
                size="md"
                onClick={copyToClipboard}
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button
                id="close-modal-button"
                data-component="CloseModalButton"
                variant="outline"
                size="md"
                onClick={() => setShowRoomModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {showCopiedToast && (
        <div 
          id="copy-success-toast"
          data-component="CopySuccessToast"
          className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in-up"
        >
          <Check className="w-5 h-5" />
          <span>Link copied to clipboard!</span>
        </div>
      )}
    </>
  );
}
