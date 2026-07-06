import { getQrCodeDataUrl } from '../utils';

interface QRCodeDisplayProps {
  url: string;
}

export default function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  return (
    <div className="tfa-qr-wrapper">
      <div className="tfa-qr-box">
        <img
          src={getQrCodeDataUrl(url)}
          alt="2FA QR Code"
          width={200}
          height={200}
          className="tfa-qr-image"
        />
      </div>
    </div>
  );
}
