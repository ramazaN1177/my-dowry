import Tesseract from "tesseract.js";
import axios from "axios";
import sharp from "sharp";

export interface BookInfo {
    title: string;
    author: string;
}

export class OCRService {
    /**
     * Görüntüyü hafifçe optimize eder (agresif değil)
     */
    private static async preprocessImageLight(buffer: Buffer): Promise<Buffer> {
        try {
            // Sadece hafif optimizasyon: boyutu artır ve keskinleştir
            const processedBuffer = await sharp(buffer)
                .resize(null, 2000, { // Yüksekliği 2000px'e çıkar (genişlik orantılı)
                    fit: 'inside',
                    withoutEnlargement: false
                })
                .sharpen({ sigma: 1.5 }) // Hafif keskinleştirme
                .toBuffer();
            
            return processedBuffer;
        } catch (error) {
            console.error("Görüntü ön işleme hatası:", error);
            return buffer;
        }
    }

    /**
     * Metinden kelime sayısını döndürür
     */
    private static countWords(text: string): number {
        return text.split(/\s+/).filter(w => w.length > 2).length;
    }

    /**
      * Base64 resimden metin çıkarır (Tesseract OCR)
      * Birden fazla yöntem dener ve en iyi sonucu seçer
      */
    static async extractTextFromBase64(base64Data: string): Promise<string> {
        try {
            console.log("Tesseract OCR başlatılıyor...");
            const originalBuffer = Buffer.from(base64Data, "base64");

            // Strateji 1: Orijinal görüntü ile OCR
            console.log("Strateji 1: Orijinal görüntü ile OCR...");
            const { data: { text: text1 } } = await Tesseract.recognize(originalBuffer, 'tur+eng', {
                logger: info => {
                    if (info.status === "recognizing text") {
                        console.log("OCR işlemi devam ediyor...");
                    }
                }
            });

            const wordCount1 = this.countWords(text1);
            console.log(`Strateji 1 sonucu: ${wordCount1} kelime bulundu`);
            
            // Strateji 2: Hafif optimize edilmiş görüntü ile OCR
            console.log("Strateji 2: Optimize edilmiş görüntü ile OCR...");
            const processedBuffer = await this.preprocessImageLight(originalBuffer);
            const { data: { text: text2 } } = await Tesseract.recognize(processedBuffer, 'tur+eng', {
                logger: info => {
                    if (info.status === "recognizing text") {
                        console.log("OCR işlemi devam ediyor...");
                    }
                }
            });

            const wordCount2 = this.countWords(text2);
            console.log(`Strateji 2 sonucu: ${wordCount2} kelime bulundu`);
            
            // Daha fazla kelime bulan stratejiyi seç
            const bestText = wordCount2 > wordCount1 ? text2 : text1;
            console.log(`En iyi sonuç: Strateji ${wordCount2 > wordCount1 ? '2' : '1'} (${Math.max(wordCount1, wordCount2)} kelime)`);
            console.log("Tesseract OCR işlemi tamamlandı.");
            
            return bestText.trim();
        } catch (error) {
            console.error("Tesseract OCR hatası:", error);
            throw new Error("Tesseract OCR hatası");
        }
    }

    /**
     * Yaygın yazar isimlerini kontrol eder
     */
    private static isLikelyAuthorName(word: string): boolean {
        // Büyük harfle başlayan ve en az 3 karakter uzunluğunda
        return /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}/.test(word) || 
               /^[A-Z]{2,}$/.test(word); // Tamamı büyük harf (DAN, BROWN gibi)
    }

    /**
     * Gereksiz metinleri temizler ama yazar isimlerini korur
     */
    private static cleanText(text: string, preserveCase: boolean = false): string {
        let cleaned = text;
        
        // Yaygın Türkçe ve İngilizce gürültüleri kaldır (kelime sınırları ile)
        const noisePatterns = [
            /\byayınları?\b/gi,
            /\byayınevi\b/gi,
            /\bklasikler\b/gi,
            /\bdizisi?\b/gi,
            /\bkitap\b/gi,
            /\broman\b/gi,
            /\bhikaye\b/gi,
            /\böykü\b/gi,
            /\bpublishing\b/gi,
            /\bpublishers?\b/gi,
            /\bpress\b/gi,
            /\bbooks?\b/gi,
            /\bnovel\b/gi,
            /\bedition\b/gi,
            /\bbasım\b/gi,
            /\bçeviri\b/gi,
            /\btranslation\b/gi,
            /\bseries\b/gi,
            /\bcollection\b/gi,
            /\bhasan\b/gi,
            /\bali\b/gi,
            /\byücel\b/gi,
        ];
        
        noisePatterns.forEach(pattern => {
            cleaned = cleaned.replace(pattern, ' ');
        });
        
        // Özel karakterleri temizle ama harfleri koru
        cleaned = cleaned.replace(/[|_\-:;]/g, ' ');
        
        if (!preserveCase) {
            cleaned = cleaned.toLowerCase();
        }
        
        // Fazla boşlukları temizle
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
    }

    /**
     * Yaygın filler kelimeler (yazar ismi olamaz)
     */
    private static isFillerWord(word: string): boolean {
        const fillers = ['the', 'a', 'an', 'in', 'of', 'and', 'or', 'to', 'from', 've', 'da', 'de'];
        return fillers.includes(word.toLowerCase().trim());
    }

    /**
     * Metinden olası yazar isimlerini bul (Türkçe kelimeler içermeyenler)
     */
    private static findAuthorNames(lines: string[]): string[] {
        const authors: string[] = [];
        const cleanedLines: string[] = [];
        
        // Önce özel karakterleri temizle ve filtre
        for (const line of lines) {
            const cleaned = line.replace(/[|_\-:;]/g, ' ').trim();
            if (cleaned.length > 0) {
                cleanedLines.push(cleaned);
            }
        }
        
        // Ardışık büyük harfli satırları birleştir (yazar isimleri yan yana olabilir)
        for (let i = 0; i < cleanedLines.length; i++) {
            const line = cleanedLines[i];
            const words = line.split(/\s+/).filter(w => w.length > 0);
            
            // Türkçe kelime içeriyorsa, bu başlık olabilir, yazar değil
            const hasTurkishWords = words.some(w => 
                /[çğıöşüÇĞİÖŞÜ]/.test(w) || this.isCommonTurkishWord(w)
            );
            
            if (hasTurkishWords) {
                continue; // Bu satırı yazar olarak almayalım
            }
            
            if (words.length >= 1 && words.length <= 4) {
                const upperCount = (line.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
                const letterCount = (line.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
                
                // Çoğunluğu büyük harf ve filler kelime değil
                if (letterCount >= 2 && upperCount > letterCount * 0.5) {
                    // Filler kelimeleri kontrol et
                    const hasOnlyFillers = words.every(w => this.isFillerWord(w));
                    if (!hasOnlyFillers) {
                        // Bir sonraki satır da büyük harfli mi? Birleştir
                        if (i + 1 < cleanedLines.length) {
                            const nextLine = cleanedLines[i + 1];
                            const nextWords = nextLine.split(/\s+/).filter(w => w.length > 0);
                            
                            // Sonraki satır da Türkçe kelime içermiyorsa
                            const nextHasTurkish = nextWords.some(w => 
                                /[çğıöşüÇĞİÖŞÜ]/.test(w) || this.isCommonTurkishWord(w)
                            );
                            
                            if (!nextHasTurkish) {
                                const nextUpperCount = (nextLine.match(/[A-ZÇĞİÖŞÜ]/g) || []).length;
                                const nextLetterCount = (nextLine.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ]/g) || []).length;
                                
                                if (nextWords.length >= 1 && nextWords.length <= 3 && 
                                    nextLetterCount >= 2 && nextUpperCount > nextLetterCount * 0.5) {
                                    // Her iki satırı birleştir
                                    const combined = `${line} ${nextLine}`.trim();
                                    const combinedWords = combined.split(/\s+/).filter(w => !this.isFillerWord(w));
                                    if (combinedWords.length >= 2 && combinedWords.length <= 4) {
                                        authors.push(combinedWords.join(' '));
                                        i++; // Sonraki satırı atla
                                        continue;
                                    }
                                }
                            }
                        }
                        
                        // Sadece bu satır
                        const filteredWords = words.filter(w => !this.isFillerWord(w));
                        if (filteredWords.length >= 1) {
                            authors.push(filteredWords.join(' '));
                        }
                    }
                }
            }
        }
        
        return authors;
    }

    /**
     * Metinden olası kitap başlıklarını bul
     */
    private static findTitles(lines: string[]): string[] {
        const titles: string[] = [];
        
        for (const line of lines) {
            const cleaned = this.cleanText(line, true);
            // En az 5 karakter ve çok fazla özel karakter yok
            if (cleaned.length >= 5 && cleaned.length <= 100) {
                const specialChars = (cleaned.match(/[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9\s]/g) || []).length;
                if (specialChars < 5) {
                    titles.push(cleaned);
                }
            }
        }
        
        return titles;
    }

    /**
     * Yaygın Türkçe kelimeleri kontrol eder
     */
    private static isCommonTurkishWord(word: string): boolean {
        const commonTurkishWords = [
            'siyah', 'beyaz', 'kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu', 'mor',
            'lale', 'gül', 'karanfil', 'orkide',
            'kitap', 'roman', 'hikaye', 'öykü', 'şiir',
            'savaş', 'barış', 'aşk', 'nefret', 'korku',
            'güzel', 'çirkin', 'büyük', 'küçük', 'uzun', 'kısa',
            'dünya', 'yer', 'gök', 'deniz', 'dağ',
            've', 'veya', 'ama', 'fakat', 'çünkü', 'için', 'ile', 'gibi',
            'bir', 'iki', 'üç', 'dört', 'beş',
            'yeni', 'eski', 'genç', 'yaşlı',
            'gün', 'gece', 'sabah', 'akşam',
            'adam', 'kadın', 'çocuk', 'insan', 'kişi'
        ];
        
        const lowerWord = word.toLowerCase();
        return commonTurkishWords.includes(lowerWord);
    }

    /**
     * Metindeki Türkçe kelime yüzdesini hesaplar
     */
    private static getTurkishWordPercentage(text: string): number {
        const words = text.split(/\s+/).filter(w => w.length > 2);
        if (words.length === 0) return 0;
        
        let turkishCount = 0;
        for (const word of words) {
            // Türkçe özel karakterler var mı?
            if (/[çğıöşüÇĞİÖŞÜ]/.test(word)) {
                turkishCount++;
            }
            // Veya yaygın Türkçe kelime mi?
            else if (this.isCommonTurkishWord(word)) {
                turkishCount++;
            }
        }
        
        return turkishCount / words.length;
    }

    /**
     * Metinden olası yazar ve başlık kombinasyonlarını çıkarır
     */
    private static extractSearchQueries(searchText: string): string[] {
        const lines = searchText
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 2);
        
        if (lines.length === 0) {
            return [];
        }

        const queries: string[] = [];
        
        // Olası yazar ve başlıkları bul
        const possibleAuthors = this.findAuthorNames(lines);
        const possibleTitles = this.findTitles(lines);
        
        // Metnin Türkçe olup olmadığını kontrol et
        const turkishPercentage = this.getTurkishWordPercentage(searchText);
        const isTurkishText = turkishPercentage > 0.3;
        
        // Türkçe başlıkları öne çek (öncelikli olarak kullanılsın)
        const sortedTitles = [...possibleTitles].sort((a, b) => {
            const aTurkish = this.isTurkishTitle(a) ? 1 : 0;
            const bTurkish = this.isTurkishTitle(b) ? 1 : 0;
            return bTurkish - aTurkish; // Türkçe olanlar önce
        });
        
        console.log('Olası yazarlar:', possibleAuthors);
        console.log('Olası başlıklar (sıralı):', sortedTitles);
        console.log(`Türkçe kelime oranı: %${(turkishPercentage * 100).toFixed(0)} - Türkçe metin: ${isTurkishText ? 'Evet' : 'Hayır'}`);
        
        // ÖNCELİK: Yazar + Başlık kombinasyonları (en etkili arama)
        if (possibleAuthors.length > 0 && sortedTitles.length > 0) {
            // Tüm yazar ve başlık kombinasyonlarını dene
            for (let i = 0; i < Math.min(3, possibleAuthors.length); i++) {
                for (let j = 0; j < sortedTitles.length; j++) {
                    const author = possibleAuthors[i];
                    const title = sortedTitles[j];
                    
                    if (author !== title) {
                        const combined = `${author} ${title}`;
                        // Türkçe metinse başlığı olduğu gibi koru (çevrilmesini önle)
                        if (isTurkishText && this.isTurkishTitle(title)) {
                            queries.push(this.cleanText(combined, true).toLowerCase());
                        } else {
                            queries.push(this.cleanText(combined));
                        }
                    }
                }
            }
        }
        
        // YEDEK: Eğer yazar + başlık kombinasyonu yoksa, diğer stratejiler
        if (queries.length === 0) {
            // Sadece başlıklar (Türkçe ise koru)
            sortedTitles.slice(0, 3).forEach(title => {
                if (isTurkishText && this.isTurkishTitle(title)) {
                    queries.push(this.cleanText(title, true).toLowerCase());
                } else {
                    queries.push(this.cleanText(title));
                }
            });
            
            // Sadece yazar isimleri
            possibleAuthors.slice(0, 3).forEach(author => {
                queries.push(this.cleanText(author));
            });
            
            // En uzun satırları birleştir
            const sortedByLength = [...lines].sort((a, b) => b.length - a.length);
            if (sortedByLength.length >= 2) {
                const topTwo = sortedByLength.slice(0, 2).join(' ');
                queries.push(this.cleanText(topTwo));
            }
            
            // İlk birkaç satırı birleştir
            if (lines.length >= 2) {
                const firstLines = lines.slice(0, Math.min(3, lines.length)).join(' ');
                queries.push(this.cleanText(firstLines));
            }
        }
        
        // Benzersiz ve anlamlı olanları al (en az 3 karakter)
        const uniqueQueries = [...new Set(queries)].filter(q => q.length >= 3);
        
        // İlk 10 stratejiyi dene (daha fazla deneme)
        return uniqueQueries.slice(0, 10);
    }

    /**
     * Başlığın Türkçe olup olmadığını kontrol eder
     */
    private static isTurkishTitle(title: string): boolean {
        const turkishChars = /[çğıöşüÇĞİÖŞÜ]/;
        const turkishWords = ['ve', 'bir', 'için', 'ile', 'bu', 'şu', 'o'];
        
        // Türkçe karakterler var mı?
        if (turkishChars.test(title)) {
            return true;
        }
        
        // Yaygın Türkçe kelimeler var mı?
        const lowerTitle = title.toLowerCase();
        return turkishWords.some(word => lowerTitle.includes(word));
    }

    /**
     * Arama sorgusundaki Türkçe kelimeleri çıkarır
     */
    private static extractTurkishKeywords(query: string): string[] {
        const words = query.split(/\s+/).filter(w => w.length > 2);
        const turkishWords: string[] = [];
        
        for (const word of words) {
            // Türkçe özel karakterler var mı veya yaygın Türkçe kelime mi?
            if (/[çğıöşüÇĞİÖŞÜ]/.test(word) || this.isCommonTurkishWord(word)) {
                turkishWords.push(word.toLowerCase());
            }
        }
        
        return turkishWords;
    }

    /**
     * Başlık ile Türkçe anahtar kelimelerin eşleşme skorunu hesaplar
     */
    private static calculateTurkishMatchScore(title: string, turkishKeywords: string[]): number {
        if (turkishKeywords.length === 0) return 0;
        
        const titleLower = title.toLowerCase();
        let matchCount = 0;
        
        for (const keyword of turkishKeywords) {
            if (titleLower.includes(keyword)) {
                matchCount++;
            }
        }
        
        return matchCount / turkishKeywords.length;
    }

    /**
     * Google Books API'den kitap bilgisi arar
     */
    private static async searchBookInGoogleBooks(searchQuery: string, turkishKeywords: string[]): Promise<BookInfo | null> {
        try {
            const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
                params: {
                    q: searchQuery,
                    maxResults: 20,
                    langRestrict: turkishKeywords.length > 0 ? 'tr' : undefined, // Türkçe kelime varsa Türkçe kitap ara
                    printType: 'books'
                },
                timeout: 15000
            });

            if (response.data.items && response.data.items.length > 0) {
                const books = response.data.items;
                
                // Eğer Türkçe anahtar kelimeler varsa, bunları içeren başlıkları bul
                if (turkishKeywords.length > 0) {
                    for (const item of books) {
                        const book = item.volumeInfo;
                        if (!book.title) continue;
                        
                        const matchScore = this.calculateTurkishMatchScore(book.title, turkishKeywords);
                        
                        if (matchScore >= 0.5) {
                            const bookInfo: BookInfo = {
                                title: book.title,
                                author: book.authors && book.authors.length > 0 ? book.authors[0] : 'Unknown Author',
                            };
                            console.log(`  ✓ Google Books - Türkçe eşleşme (${(matchScore * 100).toFixed(0)}%):`, bookInfo);
                            return bookInfo;
                        }
                    }
                }
                
                // İlk sonucu döndür
                const book = books[0].volumeInfo;
                if (book.title) {
                    const bookInfo: BookInfo = {
                        title: book.title,
                        author: book.authors && book.authors.length > 0 ? book.authors[0] : 'Unknown Author',
                    };
                    console.log(`  → Google Books sonucu:`, bookInfo);
                    return bookInfo;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Google Books API Error:', error);
            return null;
        }
    }

    /**
     * Open Library API'den kitap bilgisi arar
     */
    private static async searchBookInOpenLibrary(searchQuery: string, turkishKeywords: string[]): Promise<BookInfo | null> {
        try {
            const response = await axios.get('https://openlibrary.org/search.json', {
                params: {
                    q: searchQuery,
                    limit: 15,
                    fields: 'title,author_name,first_publish_year,language'
                },
                timeout: 15000
            });

            if (response.data.docs && response.data.docs.length > 0) {
                const books = response.data.docs;
                
                // Eğer Türkçe anahtar kelimeler varsa, bunları içeren başlıkları bul
                if (turkishKeywords.length > 0) {
                    for (const book of books) {
                        const matchScore = this.calculateTurkishMatchScore(book.title, turkishKeywords);
                        
                        if (matchScore >= 0.5) {
                            const bookInfo: BookInfo = {
                                title: book.title,
                                author: book.author_name ? book.author_name[0] : 'Unknown Author',
                            };
                            console.log(`  ✓ Open Library - Türkçe eşleşme (${(matchScore * 100).toFixed(0)}%):`, bookInfo);
                            return bookInfo;
                        }
                    }
                }
                
                // Türkçe kelime eşleşmesi yoksa, Türkçe karakter içeren başlık ara
                for (const book of books) {
                    if (this.isTurkishTitle(book.title)) {
                        const bookInfo: BookInfo = {
                            title: book.title,
                            author: book.author_name ? book.author_name[0] : 'Unknown Author',
                        };
                        console.log(`  ✓ Open Library - Türkçe karakterli başlık:`, bookInfo);
                        return bookInfo;
                    }
                }
                
                // İlk sonucu kullan
                const book = books[0];
                const bookInfo: BookInfo = {
                    title: book.title || 'Unknown Title',
                    author: book.author_name ? book.author_name[0] : 'Unknown Author',
                };
                console.log(`  → Open Library sonucu:`, bookInfo);
                return bookInfo;
            }

            return null;
        } catch (error) {
            console.error('Open Library API Error:', error);
            return null;
        }
    }

    /**
     * Birden fazla API'den kitap bilgisi arar
     */
    static async searchBookInAPIs(searchText: string): Promise<BookInfo | null> {
        try {
            const searchQueries = this.extractSearchQueries(searchText);
            
            if (searchQueries.length === 0) {
                throw new Error("No valid search text found");
            }

            // Her bir stratejiyi dene
            for (let i = 0; i < searchQueries.length; i++) {
                const searchQuery = searchQueries[i].substring(0, 150);
                console.log(`\n[Strateji ${i + 1}/${searchQueries.length}] Arama sorgusu:`, searchQuery);

                // Arama sorgusundaki Türkçe kelimeleri çıkar
                const turkishKeywords = this.extractTurkishKeywords(searchQuery);
                const hasTurkishKeywords = turkishKeywords.length > 0;
                
                if (hasTurkishKeywords) {
                    console.log(`  → Türkçe anahtar kelimeler: [${turkishKeywords.join(', ')}]`);
                }

                // Önce Google Books API'yi dene (daha iyi Türkçe desteği)
                console.log(`  📚 Google Books API deneniyor...`);
                const googleResult = await this.searchBookInGoogleBooks(searchQuery, turkishKeywords);
                if (googleResult) {
                    return googleResult;
                }

                // Google Books'ta bulunamazsa Open Library'yi dene
                console.log(`  📖 Open Library API deneniyor...`);
                const openLibraryResult = await this.searchBookInOpenLibrary(searchQuery, turkishKeywords);
                if (openLibraryResult) {
                    return openLibraryResult;
                }
                
                console.log(`  ✗ Strateji ${i + 1} ile kitap bulunamadı`);
            }

            console.log("\n❌ Hiçbir strateji ile kitap bulunamadı.");
            return null;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Open Library API Error:', error.message);
            } else {
                console.error('Open Library Search Error:', error);
            }
            throw new Error('Failed to search book in Open Library');
        }
    }
    /**
     * Tam OCR ve kitap arama işlemi
     */
    static async processBookImage(base64Data:string):Promise<BookInfo | null>{
        try {

            console.log('📖 Kitap görüntüsü işleniyor...');

            // 1. Resimden Metin Çıkar 
            const extractedText = await this.extractTextFromBase64(base64Data);
            console.log('📝 OCR ile çıkarılan metin:', extractedText);

            // 2. Metinden kitap bilgisi arama (Google Books + Open Library)
            const bookInfo = await this.searchBookInAPIs(extractedText);
            console.log('\n✅ Bulunan kitap bilgisi:', bookInfo);
            return bookInfo;
            
        } catch (error) {
            console.error('❌ Kitap işleme hatası:', error);
            return null;
        }
    }

}