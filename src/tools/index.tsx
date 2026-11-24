import type { ComponentType } from "react";
import { PasswordGenerator } from "@/tools/PasswordGenerator";
import { UsernameGenerator } from "@/tools/UsernameGenerator";
import { RandomChoicePicker, RandomNumberGenerator } from "@/tools/RandomTools";
import { WordCounter, CaseConverter } from "@/tools/TextTools";
import { PercentageCalculator, UnitConverter, BmiCalculator } from "@/tools/MathTools";
import { StopwatchTimer, AgeCalculator } from "@/tools/TimeTools";
import { ColorPaletteGenerator, QrCodeGenerator } from "@/tools/DesignTools";
import { InternetSpeedGuide, PcBottleneckCalculator } from "@/tools/TechTools";
import {
  Base64Tool,
  JsonFormatter,
  TimestampConverter,
  UrlEncoderTool,
} from "@/tools/DevEncoding";
import { MarkdownEditor, RegexTester, TextDiffChecker } from "@/tools/DevText";
import { ContrastChecker, GradientGenerator, ImageCompressor } from "@/tools/VisualTools";
import { PercentageChangeCalculator, DiscountCalculator, AverageCalculator, GradeCalculator, CookingConverter } from "@/tools/EverydayCalculators";
import { DateDifference, TimeDurationCalculator } from "@/tools/TimeMathTools";
import { ParentHeightPredictor, ChildBmiCalculator } from "@/tools/FamilyTools";
import { PdfMergeTool, PdfSplitTool, PdfPageExtractorTool, PdfCompressorTool, PdfToImagesTool, ImagesToPdfTool, PdfOrganizerTool, PdfMetadataTool, PdfToTextTool } from "@/tools/LazyPdfTools";
import { BulkImageProcessor, ImageDimensionsChecker, ImageMetadataViewer, FaviconGenerator, SocialImageResizer } from "@/tools/ImageWorkspace";
import { CsvJsonConverter, JsonXmlConverter, CsvViewerEditor, CsvColumnSorter, CsvDuplicateRemover, XlsxPreview, FileSizeConverter } from "@/tools/FileConversion";
import { LoanMortgageCalculator, VatCalculator, TipBillSplitter, FuelCostCalculator, ElectricityCostCalculator, TimeZoneConverter, WorkingDaysCalculator } from "@/tools/MoneyTools";
import { PassphraseGenerator, UuidGenerator, SecureTokenGenerator, RandomTeamGenerator, StudyPomodoroTimer, ExamCountdown, FlashcardCreator, ChecklistMaker } from "@/tools/SecurityStudent";
import { RemoveDuplicateLines, SortTextLines, TextCleaner, LoremIpsumGenerator, ReadingTimeCalculator, TextReverser } from "@/tools/TextWorkbench";
import { ImageResizer, ImageCropper, ImageFormatConverter, ImageToBase64 } from "@/tools/ImageStudio";
import { HtmlFormatter, XmlFormatter, SqlFormatter, JsMinifier } from "@/tools/MarkupTools";
import { WifiQrGenerator, HttpStatusLookup, UserAgentParser, IpAddressInfo } from "@/tools/WebDevTools";

export const toolComponents: Record<string, ComponentType> = {
  "password-generator": PasswordGenerator,
  "username-generator": UsernameGenerator,
  "random-number-generator": RandomNumberGenerator,
  "random-choice-picker": RandomChoicePicker,
  "word-counter": WordCounter,
  "case-converter": CaseConverter,
  "percentage-calculator": PercentageCalculator,
  "unit-converter": UnitConverter,
  "bmi-calculator": BmiCalculator,
  "stopwatch-timer": StopwatchTimer,
  "age-calculator": AgeCalculator,
  "color-palette-generator": ColorPaletteGenerator,
  "qr-code-generator": QrCodeGenerator,
  "internet-speed-guide": InternetSpeedGuide,
  "pc-bottleneck-calculator": PcBottleneckCalculator,
  "json-formatter-validator": JsonFormatter,
  "base64-encoder-decoder": Base64Tool,
  "url-encoder-decoder": UrlEncoderTool,
  "timestamp-converter": TimestampConverter,
  "text-diff-checker": TextDiffChecker,
  "markdown-editor": MarkdownEditor,
  "image-compressor": ImageCompressor,
  "color-contrast-checker": ContrastChecker,
  "css-gradient-generator": GradientGenerator,
  "regex-tester": RegexTester,
  "parent-height-predictor": ParentHeightPredictor,
  "childrens-bmi-calculator": ChildBmiCalculator,
  "percentage-increase-calculator": PercentageChangeCalculator,
  "discount-calculator": DiscountCalculator,
  "average-calculator": AverageCalculator,
  "grade-calculator": GradeCalculator,
  "cooking-measurement-converter": CookingConverter,
  "date-difference-calculator": DateDifference,
  "time-duration-calculator": TimeDurationCalculator,
  "remove-duplicate-lines": RemoveDuplicateLines,
  "sort-text-lines": SortTextLines,
  "text-cleaner": TextCleaner,
  "lorem-ipsum-generator": LoremIpsumGenerator,
  "reading-time-calculator": ReadingTimeCalculator,
  "text-reverser": TextReverser,
  "image-resizer": ImageResizer,
  "image-cropper": ImageCropper,
  "image-format-converter": ImageFormatConverter,
  "image-to-base64": ImageToBase64,
  "html-formatter": HtmlFormatter,
  "xml-formatter": XmlFormatter,
  "sql-formatter": SqlFormatter,
  "javascript-minifier": JsMinifier,
  "wifi-qr-code-generator": WifiQrGenerator,
  "http-status-code-lookup": HttpStatusLookup,
  "user-agent-parser": UserAgentParser,
  "ip-address-lookup": IpAddressInfo,
  "pdf-merge": PdfMergeTool,
  "pdf-split": PdfSplitTool,
  "pdf-page-extractor": PdfPageExtractorTool,
  "pdf-compressor": PdfCompressorTool,
  "pdf-to-images": PdfToImagesTool,
  "images-to-pdf": ImagesToPdfTool,
  "pdf-organizer": PdfOrganizerTool,
  "pdf-metadata-viewer": PdfMetadataTool,
  "pdf-to-text": PdfToTextTool,
  "bulk-image-processor": BulkImageProcessor,
  "image-dimensions-checker": ImageDimensionsChecker,
  "image-metadata-viewer": ImageMetadataViewer,
  "favicon-generator": FaviconGenerator,
  "social-media-image-resizer": SocialImageResizer,
  "csv-json-converter": CsvJsonConverter,
  "json-xml-converter": JsonXmlConverter,
  "csv-viewer-editor": CsvViewerEditor,
  "csv-column-sorter": CsvColumnSorter,
  "csv-duplicate-remover": CsvDuplicateRemover,
  "xlsx-preview": XlsxPreview,
  "file-size-converter": FileSizeConverter,
  "loan-mortgage-calculator": LoanMortgageCalculator,
  "vat-calculator": VatCalculator,
  "tip-bill-splitter": TipBillSplitter,
  "fuel-cost-calculator": FuelCostCalculator,
  "electricity-cost-calculator": ElectricityCostCalculator,
  "time-zone-converter": TimeZoneConverter,
  "working-days-calculator": WorkingDaysCalculator,
  "passphrase-generator": PassphraseGenerator,
  "uuid-generator": UuidGenerator,
  "secure-token-generator": SecureTokenGenerator,
  "random-team-generator": RandomTeamGenerator,
  "study-pomodoro-timer": StudyPomodoroTimer,
  "exam-countdown": ExamCountdown,
  "flashcard-creator": FlashcardCreator,
  "checklist-maker": ChecklistMaker,
};
