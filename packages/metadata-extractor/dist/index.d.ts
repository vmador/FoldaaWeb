export interface WebsiteMetadata {
    title: string;
    description: string;
    favicon: string;
    appleTouchIcon?: string;
    ogImage: string;
    themeColor: string;
    url: string;
}
export declare function extractMetadata(url: string): Promise<WebsiteMetadata>;
