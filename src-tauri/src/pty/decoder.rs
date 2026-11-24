/// Decodifica UTF-8 em pedaços, sem quebrar caracteres multibyte que chegam
/// divididos entre duas leituras do PTY.
#[derive(Debug, Default)]
pub struct Utf8Decoder {
    pending: Vec<u8>,
}

impl Utf8Decoder {
    pub fn decode(&mut self, input: &[u8]) -> String {
        self.pending.extend_from_slice(input);
        let mut out = String::with_capacity(self.pending.len());
        let mut start = 0;

        loop {
            match std::str::from_utf8(&self.pending[start..]) {
                Ok(text) => {
                    out.push_str(text);
                    start = self.pending.len();
                    break;
                }
                Err(err) => {
                    let valid_end = start + err.valid_up_to();
                    if let Ok(text) = std::str::from_utf8(&self.pending[start..valid_end]) {
                        out.push_str(text);
                    }
                    start = valid_end;
                    match err.error_len() {
                        // Bytes inválidos: substitui e continua.
                        Some(len) => {
                            out.push('\u{FFFD}');
                            start += len;
                        }
                        // Caractere incompleto no fim: guarda para a próxima leitura.
                        None => break,
                    }
                }
            }
        }

        self.pending.drain(..start);
        out
    }
}

#[cfg(test)]
mod tests {
    use super::Utf8Decoder;

    #[test]
    fn decodifica_ascii_direto() {
        let mut d = Utf8Decoder::default();
        assert_eq!(d.decode(b"ola mundo"), "ola mundo");
    }

    #[test]
    fn junta_caractere_dividido_entre_leituras() {
        let mut d = Utf8Decoder::default();
        let bytes = "ação".as_bytes(); // 'ç' e 'ã' têm 2 bytes
        assert_eq!(d.decode(&bytes[..2]), "a");
        assert_eq!(d.decode(&bytes[2..]), "ção");
    }

    #[test]
    fn junta_emoji_dividido_em_varias_leituras() {
        let mut d = Utf8Decoder::default();
        let bytes = "🚀".as_bytes(); // 4 bytes
        assert_eq!(d.decode(&bytes[..1]), "");
        assert_eq!(d.decode(&bytes[1..3]), "");
        assert_eq!(d.decode(&bytes[3..]), "🚀");
    }

    #[test]
    fn substitui_bytes_invalidos() {
        let mut d = Utf8Decoder::default();
        assert_eq!(d.decode(&[b'a', 0xFF, b'b']), "a\u{FFFD}b");
    }
}
