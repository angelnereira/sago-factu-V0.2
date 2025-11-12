import { DOMParser, XMLSerializer } from "@xmldom/xmldom"

export function canonicalizeXml(xmlString: string): string {
  const document = new DOMParser().parseFromString(xmlString, "text/xml")
  return new XMLSerializer().serializeToString(document)
}

export function normalizeXmlWhitespace(xmlString: string): string {
  return canonicalizeXml(xmlString)
}



