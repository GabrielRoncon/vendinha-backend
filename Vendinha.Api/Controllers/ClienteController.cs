using Microsoft.AspNetCore.Mvc;
using Vendinha.Models;
using Vendinha.Services;

namespace Vendinha.Api.Controllers
{
    [Route("api/[controller]")] // api/cliente
    public class ClienteController : ControllerBase
    {
        private readonly ClienteService service;

        public ClienteController(ClienteService service)
        {
            this.service = service;
        }

        // GET api/cliente?pesquisa=maria&page=1
        [HttpGet]
        public IActionResult Listar(string pesquisa, int page = 1)
        {
            return Ok(service.Listar(pesquisa, page));
        }

        // GET api/cliente/5
        [HttpGet("{id:int}")]
        public IActionResult Obter(int id)
        {
            var cliente = service.Obter(id);
            if (cliente == null)
            {
                return NotFound();
            }
            return Ok(cliente);
        }

        // POST api/cliente
        [HttpPost]
        public IActionResult Cadastrar([FromBody] Cliente cliente)
        {
            if (cliente == null)
            {
                return BadRequest("Corpo da requisição ausente ou inválido.");
            }

            var sucesso = service.Criar(cliente, out var erros);
            if (sucesso)
            {
                // 201 Created + cabeçalho Location apontando para o novo cliente
                return CreatedAtAction(nameof(Obter), new { id = cliente.Id }, cliente);
            }
            return UnprocessableEntity(erros);
        }

        // PUT api/cliente/5
        [HttpPut("{id:int}")]
        public IActionResult Atualizar(int id, [FromBody] Cliente dados)
        {
            if (dados == null)
            {
                return BadRequest("Corpo da requisição ausente ou inválido.");
            }

            var existente = service.Obter(id);
            if (existente == null)
            {
                return NotFound();
            }

            var sucesso = service.Atualizar(existente, dados, out var erros);
            if (sucesso)
            {
                return Ok(existente);
            }
            return UnprocessableEntity(erros);
        }

        // DELETE api/cliente/5
        [HttpDelete("{id:int}")]
        public IActionResult Excluir(int id)
        {
            var excluiu = service.Excluir(id);
            if (!excluiu)
            {
                return NotFound();
            }
            return NoContent();
        }
    }
}
