declare interface Window {
  ZJSBridge?: any;
  APP_ID?: string;
  BASE_PATH?: string;
  APP_CONFIG: any;
}

declare module "qrcode" {
  type QrCodeOptions = {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  };

  const QRCode: {
    toDataURL(text: string, options?: QrCodeOptions): Promise<string>;
  };

  export default QRCode;
}
