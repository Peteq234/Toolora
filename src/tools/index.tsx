import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { PdfMergeTool, PdfSplitTool, PdfPageExtractorTool, PdfCompressorTool, PdfToImagesTool, ImagesToPdfTool, PdfOrganizerTool, PdfMetadataTool, PdfToTextTool } from "@/tools/LazyPdfTools";
import { ChessPlaygroundTool } from "@/tools/LazyChess";
import { SvgOptimizer, ColorPaletteExtractor, JsFormatter, YamlFormatter, HashGenerator, JwtDecoder, CronHelper, UnixPermissions, NumberBaseConverter } from "@/tools/DevPowerTools";

/**
 * Tool components are code-split per module. Only the tool the visitor opens is
 * downloaded, which keeps the initial page small and mobile-first.
 */
const lazyModule = <T extends Record<string, ComponentType>>(
  loader: () => Promise<T>
): ((name: keyof T & string) => ComponentType) => {
  const cache = new Map<string, LazyExoticComponent<ComponentType>>();
  return (name) => {
    if (!cache.has(name)) {
      cache.set(
        name,
        lazy(async () => {
          const module = await loader();
          const component = module[name] as ComponentType | undefined;
          if (!component) throw new Error(`Tool component "${name}" is missing.`);
          return { default: component };
        })
      );
    }
    return cache.get(name) as unknown as ComponentType;
  };
};

const password = lazyModule(() => import("@/tools/PasswordGenerator"));
const username = lazyModule(() => import("@/tools/UsernameGenerator"));
const random = lazyModule(() => import("@/tools/RandomTools"));
const text = lazyModule(() => import("@/tools/TextTools"));
const math = lazyModule(() => import("@/tools/MathTools"));
const time = lazyModule(() => import("@/tools/TimeTools"));
const design = lazyModule(() => import("@/tools/DesignTools"));
const tech = lazyModule(() => import("@/tools/TechTools"));
const devEncoding = lazyModule(() => import("@/tools/DevEncoding"));
const devText = lazyModule(() => import("@/tools/DevText"));
const visual = lazyModule(() => import("@/tools/VisualTools"));
const everyday = lazyModule(() => import("@/tools/EverydayCalculators"));
const timeMath = lazyModule(() => import("@/tools/TimeMathTools"));
const family = lazyModule(() => import("@/tools/FamilyTools"));
const textWorkbench = lazyModule(() => import("@/tools/TextWorkbench"));
const imageStudio = lazyModule(() => import("@/tools/ImageStudio"));
const markup = lazyModule(() => import("@/tools/MarkupTools"));
const webdev = lazyModule(() => import("@/tools/WebDevTools"));
const imageWorkspace = lazyModule(() => import("@/tools/ImageWorkspace"));
const fileConversion = lazyModule(() => import("@/tools/FileConversion"));
const money = lazyModule(() => import("@/tools/MoneyTools"));
const securityStudent = lazyModule(() => import("@/tools/SecurityStudent"));

export const toolComponents: Record<string, ComponentType> = {
  "password-generator": password("PasswordGenerator"),
  "username-generator": username("UsernameGenerator"),
  "random-number-generator": random("RandomNumberGenerator"),
  "random-choice-picker": random("RandomChoicePicker"),
  "word-counter": text("WordCounter"),
  "case-converter": text("CaseConverter"),
  "percentage-calculator": math("PercentageCalculator"),
  "unit-converter": math("UnitConverter"),
  "bmi-calculator": math("BmiCalculator"),
  "stopwatch-timer": time("StopwatchTimer"),
  "age-calculator": time("AgeCalculator"),
  "color-palette-generator": design("ColorPaletteGenerator"),
  "qr-code-generator": design("QrCodeGenerator"),
  "internet-speed-guide": tech("InternetSpeedGuide"),
  "pc-bottleneck-calculator": tech("PcBottleneckCalculator"),
  "json-formatter-validator": devEncoding("JsonFormatter"),
  "base64-encoder-decoder": devEncoding("Base64Tool"),
  "url-encoder-decoder": devEncoding("UrlEncoderTool"),
  "timestamp-converter": devEncoding("TimestampConverter"),
  "text-diff-checker": devText("TextDiffChecker"),
  "markdown-editor": devText("MarkdownEditor"),
  "regex-tester": devText("RegexTester"),
  "image-compressor": visual("ImageCompressor"),
  "color-contrast-checker": visual("ContrastChecker"),
  "css-gradient-generator": visual("GradientGenerator"),
  "percentage-increase-calculator": everyday("PercentageChangeCalculator"),
  "discount-calculator": everyday("DiscountCalculator"),
  "average-calculator": everyday("AverageCalculator"),
  "grade-calculator": everyday("GradeCalculator"),
  "cooking-measurement-converter": everyday("CookingConverter"),
  "date-difference-calculator": timeMath("DateDifference"),
  "time-duration-calculator": timeMath("TimeDurationCalculator"),
  "parent-height-predictor": family("ParentHeightPredictor"),
  "childrens-bmi-calculator": family("ChildBmiCalculator"),
  "remove-duplicate-lines": textWorkbench("RemoveDuplicateLines"),
  "sort-text-lines": textWorkbench("SortTextLines"),
  "text-cleaner": textWorkbench("TextCleaner"),
  "lorem-ipsum-generator": textWorkbench("LoremIpsumGenerator"),
  "reading-time-calculator": textWorkbench("ReadingTimeCalculator"),
  "text-reverser": textWorkbench("TextReverser"),
  "image-resizer": imageStudio("ImageResizer"),
  "image-cropper": imageStudio("ImageCropper"),
  "image-format-converter": imageStudio("ImageFormatConverter"),
  "image-to-base64": imageStudio("ImageToBase64"),
  "html-formatter": markup("HtmlFormatter"),
  "xml-formatter": markup("XmlFormatter"),
  "sql-formatter": markup("SqlFormatter"),
  "javascript-minifier": markup("JsMinifier"),
  "wifi-qr-code-generator": webdev("WifiQrGenerator"),
  "http-status-code-lookup": webdev("HttpStatusLookup"),
  "user-agent-parser": webdev("UserAgentParser"),
  "ip-address-lookup": webdev("IpAddressInfo"),
  "bulk-image-processor": imageWorkspace("BulkImageProcessor"),
  "image-dimensions-checker": imageWorkspace("ImageDimensionsChecker"),
  "image-metadata-viewer": imageWorkspace("ImageMetadataViewer"),
  "favicon-generator": imageWorkspace("FaviconGenerator"),
  "social-media-image-resizer": imageWorkspace("SocialImageResizer"),
  "csv-json-converter": fileConversion("CsvJsonConverter"),
  "json-xml-converter": fileConversion("JsonXmlConverter"),
  "csv-viewer-editor": fileConversion("CsvViewerEditor"),
  "csv-column-sorter": fileConversion("CsvColumnSorter"),
  "csv-duplicate-remover": fileConversion("CsvDuplicateRemover"),
  "xlsx-preview": fileConversion("XlsxPreview"),
  "file-size-converter": fileConversion("FileSizeConverter"),
  "loan-mortgage-calculator": money("LoanMortgageCalculator"),
  "vat-calculator": money("VatCalculator"),
  "tip-bill-splitter": money("TipBillSplitter"),
  "fuel-cost-calculator": money("FuelCostCalculator"),
  "electricity-cost-calculator": money("ElectricityCostCalculator"),
  "time-zone-converter": money("TimeZoneConverter"),
  "working-days-calculator": money("WorkingDaysCalculator"),
  "passphrase-generator": securityStudent("PassphraseGenerator"),
  "uuid-generator": securityStudent("UuidGenerator"),
  "secure-token-generator": securityStudent("SecureTokenGenerator"),
  "random-team-generator": securityStudent("RandomTeamGenerator"),
  "study-pomodoro-timer": securityStudent("StudyPomodoroTimer"),
  "exam-countdown": securityStudent("ExamCountdown"),
  "flashcard-creator": securityStudent("FlashcardCreator"),
  "checklist-maker": securityStudent("ChecklistMaker"),
  "pdf-merge": PdfMergeTool,
  "pdf-split": PdfSplitTool,
  "pdf-page-extractor": PdfPageExtractorTool,
  "pdf-compressor": PdfCompressorTool,
  "pdf-to-images": PdfToImagesTool,
  "images-to-pdf": ImagesToPdfTool,
  "pdf-organizer": PdfOrganizerTool,
  "pdf-metadata-viewer": PdfMetadataTool,
  "pdf-to-text": PdfToTextTool,
  "chess-playground": ChessPlaygroundTool,
  "svg-optimizer": SvgOptimizer,
  "color-palette-extractor": ColorPaletteExtractor,
  "javascript-formatter": JsFormatter,
  "yaml-formatter": YamlFormatter,
  "hash-generator": HashGenerator,
  "jwt-decoder": JwtDecoder,
  "cron-expression-helper": CronHelper,
  "unix-permissions-calculator": UnixPermissions,
  "number-base-converter": NumberBaseConverter,
};
