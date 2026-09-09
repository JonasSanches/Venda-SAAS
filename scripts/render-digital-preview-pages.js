ObjC.import("AppKit");
ObjC.import("Foundation");
ObjC.import("PDFKit");

function run(arguments) {
  if (arguments.length !== 3) throw new Error("Use: <pdf> <zero-based-page> <output.jpg>");
  const document = $.PDFDocument.alloc.initWithURL($.NSURL.fileURLWithPath(arguments[0]));
  const page = document.pageAtIndex(Math.max(0, Math.min(Number(arguments[1]), Number(document.pageCount) - 1)));
  const image = page.thumbnailOfSizeForBox($.NSMakeSize(900, 1200), $.kPDFDisplayBoxMediaBox);
  const bitmap = $.NSBitmapImageRep.imageRepWithData(image.TIFFRepresentation);
  const properties = $.NSDictionary.dictionaryWithObjectForKey(0.84, $.NSImageCompressionFactor);
  const jpeg = bitmap.representationUsingTypeProperties($.NSJPEGFileType, properties);
  jpeg.writeToURLAtomically($.NSURL.fileURLWithPath(arguments[2]), true);
}
